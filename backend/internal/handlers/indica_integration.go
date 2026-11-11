package handlers

// Integração Achadinhos Indica → marketplace.
//
// Quando um contrato no Achadinhos Indica tem a adesão confirmada/ativa,
// o Indica chama POST /api/v1/integracoes/indica/finalizado com o cadastro
// completo da empresa. O marketplace (esta API) cria ou atualiza o cadastro
// correspondente em "sellers", usando a categoria deduzida do segmento
// informado e o nível BLUE/TOP/BLACK como cert_tier, no mesmo padrão dos
// cadastros existentes.
//
// A chamada é autenticada por um segredo compartilhado (INDICA_WEBHOOK_SECRET),
// assinado via HMAC-SHA256 no cabeçalho "X-Indica-Signature" com o corpo cru
// da requisição. Sem o segredo configurado a rota responde 503.

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/achadinhos/backend/internal/auth"
	"github.com/achadinhos/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const indicaMaxBody = 8 << 20 // 8 MB

// IndicaIntegrationHandler recebe notificações de contratos finalizados no Indica.
type IndicaIntegrationHandler struct {
	db     *gorm.DB
	secret string
}

// NewIndicaIntegrationHandler cria o handler. O segredo é compartilhado com o
// Indica (INDICA_WEBHOOK_SECRET no .env do marketplace e no config.php
// privado do Indica).
func NewIndicaIntegrationHandler(db *gorm.DB, secret string) *IndicaIntegrationHandler {
	return &IndicaIntegrationHandler{db: db, secret: secret}
}

type indicaPlanDetails struct {
	AnnualCents         *int64 `json:"annualCents"`
	FeeCents            *int64 `json:"feeCents"`
	DurationMonths      *int   `json:"durationMonths"`
	Installments        *int   `json:"installments"`
	AnnualPaymentMethod string `json:"annualPaymentMethod"`
}

type indicaFinalizadoRequest struct {
	Receipt      string            `json:"receipt"`
	PlanID       string            `json:"planId"`
	Company      string            `json:"company"`
	ActivatedAt  string            `json:"activatedAt"`
	PeriodStart  string            `json:"periodStart"`
	PeriodEnd    string            `json:"periodEnd"`
	CNPJ         string            `json:"cnpj"`
	RazaoSocial  string            `json:"razaoSocial"`
	NomeFantasia string            `json:"nomeFantasia"`
	Segmento     string            `json:"segmento"`
	Endereco     string            `json:"endereco"`
	Cidade       string            `json:"cidade"`
	Estado       string            `json:"estado"`
	WhatsApp     string            `json:"whatsapp"`
	Email        string            `json:"email"`
	Instagram    string            `json:"instagram"`
	Site         string            `json:"site"`
	Logo         string            `json:"logo"`
	PlanDetails  indicaPlanDetails `json:"planDetails"`
}

type indicaSegmentMapping struct {
	keys []string
	id   string
}

// Mapeamento do "segmento de atuação" livre do Indica para as categorias
// canônicas do marketplace. A comparação é feita sobre o texto dobrado
// (minúsculas, sem acentos).
var indicaSegmentMap = []indicaSegmentMapping{
	{[]string{"elevador"}, "manutencao-elevadores"},
	{[]string{"caixa d agua", "caixa-dagua", "caixa d'água", "limpeza de caixa"}, "limpeza-caixa-dagua"},
	{[]string{"limpeza", "faxina", "higieniz"}, "limpeza"},
	{[]string{"dedetiz", "praga", "desinfecc", "desratiz"}, "dedetizacao"},
	{[]string{"caca", "vazamento"}, "caca-vazamentos"},
	{[]string{"bombe"}, "manutencao-bombas"},
	{[]string{"vidra"}, "vidracaria"},
	{[]string{"marcen"}, "marcenaria"},
	{[]string{"pintura"}, "pintura-predial"},
	{[]string{"telha"}, "telhadista"},
	{[]string{"cobertura", "garagem"}, "cobertura-garagem"},
	{[]string{"eletric"}, "eletrica"},
	{[]string{"hidraul", "encanament", "encanam"}, "hidraulica"},
	{[]string{"cabeament", "internet", "rede"}, "cabeamento-internet"},
	{[]string{"anten"}, "antenistas"},
	{[]string{"seguran", "cftv", "alarme", "camera", "controlde acesso", "monitora"}, "seguranca"},
	{[]string{"portaria"}, "portaria"},
	{[]string{"terceiriz"}, "terceirizacao"},
	{[]string{"facilities"}, "facilities"},
	{[]string{"administr", "sindico", "síndico"}, "administracao-condominios"},
	{[]string{"advoc"}, "escritorio-advocacia"},
	{[]string{"imobili"}, "imobiliaria"},
	{[]string{"auditoria", "financeir"}, "auditoria-financeira"},
	{[]string{"seguro", "garantid"}, "seguros-garantidoras"},
	{[]string{"financiamento"}, "financiamentos-projetos"},
	{[]string{"mercadinho"}, "mercadinhos"},
	{[]string{"presente", "corporativo"}, "presentes-corporativos"},
	{[]string{"condominio"}, "manutencao"},
	{[]string{"manuten"}, "manutencao"},
	{[]string{"tecnologia"}, "tecnologia"},
}

func foldText(s string) string {
	var sb strings.Builder
	for _, r := range strings.ToLower(s) {
		switch r {
		case 'ã', 'á', 'à', 'â', 'ä', 'å':
			sb.WriteRune('a')
		case 'é', 'è', 'ê', 'ë':
			sb.WriteRune('e')
		case 'í', 'ì', 'î', 'ï':
			sb.WriteRune('i')
		case 'ó', 'ò', 'õ', 'ô', 'ö':
			sb.WriteRune('o')
		case 'ú', 'ù', 'û', 'ü':
			sb.WriteRune('u')
		case 'ç':
			sb.WriteRune('c')
		case 'ñ':
			sb.WriteRune('n')
		case '-', '/', '.', '_', '\'', '"', ',':
			sb.WriteRune(' ')
		case ' ':
			sb.WriteRune(' ')
		default:
			if unicode.IsSpace(r) {
				sb.WriteRune(' ')
				continue
			}
			sb.WriteRune(r)
		}
	}
	return strings.Join(strings.Fields(sb.String()), " ")
}

func categoriaFromSegmento(seg string) string {
	norm := foldText(seg)
	for _, m := range indicaSegmentMap {
		for _, k := range m.keys {
			if strings.Contains(norm, k) {
				return m.id
			}
		}
	}
	return "manutencao"
}

func digitsOnlyString(s string) string {
	var sb strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			sb.WriteRune(r)
		}
	}
	return sb.String()
}

func certTierFromPlan(plan string) string {
	switch strings.ToUpper(strings.TrimSpace(plan)) {
	case "BLUE":
		return "blue"
	case "TOP":
		return "ouro"
	case "BLACK":
		return "black"
	default:
		return ""
	}
}

func brlFloat(cents *int64) string {
	v := int64(0)
	if cents != nil {
		v = *cents
	}
	whole := v / 100
	frac := v % 100
	if frac < 0 {
		frac = -frac
	}
	negative := v < 0
	if negative {
		whole = -whole
	}
	s := fmt.Sprintf("R$ %d,%02d", whole, frac)
	if negative {
		s = "-" + s
	}
	return s
}

func firstRuneText(s string) string {
	for _, r := range s {
		return string(r)
	}
	return "?"
}

func uniqueSellerName(db *gorm.DB, base string) string {
	var count int64
	_ = db.Model(&models.Seller{}).Where("name = ?", base).Count(&count).Error
	if count == 0 {
		return base
	}
	for i := 2; i <= 9; i++ {
		cand := fmt.Sprintf("%s (%d)", base, i)
		_ = db.Model(&models.Seller{}).Where("name = ?", cand).Count(&count).Error
		if count == 0 {
			return cand
		}
	}
	return fmt.Sprintf("%s (%s)", base, uuid.New().String()[:4])
}

// saveIndicaLogo aceita uma data URI (data:image/<tipo>;base64,<dados>) e
// grava o arquivo em ./uploads/logos/<uuid>.<ext>. Devolve a URL pública.
func saveIndicaLogo(dataURI string) (string, error) {
	dataURI = strings.TrimSpace(dataURI)
	if !strings.HasPrefix(dataURI, "data:image/") {
		return "", errors.New("logo: prefixo data:image esperado")
	}
	idx := strings.Index(dataURI, ";base64,")
	if idx < 0 {
		return "", errors.New("logo: formato base64 esperado")
	}
	mime := dataURI[len("data:image/"):idx]
	var ext string
	switch strings.ToLower(mime) {
	case "png":
		ext = ".png"
	case "jpeg", "jpg":
		ext = ".jpg"
	case "webp":
		ext = ".webp"
	case "gif":
		ext = ".gif"
	default:
		return "", errors.New("logo: tipo de imagem inválido")
	}
	raw, err := base64.StdEncoding.DecodeString(dataURI[idx+len(";base64,"):])
	if err != nil {
		return "", errors.New("logo: base64 inválido")
	}
	if len(raw) == 0 || len(raw) > 5<<20 {
		return "", errors.New("logo: arquivo ausente ou maior que 5 MB")
	}
	dir := filepath.Join(".", "uploads", "logos")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	name := uuid.New().String() + ext
	if err := os.WriteFile(filepath.Join(dir, name), raw, 0o644); err != nil {
		return "", err
	}
	return "/uploads/logos/" + name, nil
}

func hmacSHA256Hex(secret string, body []byte) string {
	m := hmac.New(sha256.New, []byte(secret))
	_, _ = m.Write(body)
	return hex.EncodeToString(m.Sum(nil))
}

func replaceSellerCategories(db *gorm.DB, s *models.Seller, catID string) error {
	var cat models.Category
	if err := db.First(&cat, "id = ?", catID).Error; err != nil {
		return err
	}
	_ = db.Model(s).Association("Categories").Replace([]models.Category{cat})
	return nil
}

// Finalizado atende POST /api/v1/integracoes/indica/finalizado.
//
// Verifica a assinatura HMAC-SHA256 do corpo cru (X-Indica-Signature) com o
// segredo compartilhado INDICA_WEBHOOK_SECRET. Cria o seller se não existir
// (por CNPJ) ou atualiza o existente, usando a categoria deduzida do campo
// "segmento" do cadastro e o plano (BLUE/TOP/BLACK) como cert_tier.
func (h *IndicaIntegrationHandler) Finalizado(c *gin.Context) {
	if h.secret == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "indica_integration_not_configured", "code": http.StatusServiceUnavailable})
		return
	}
	body, err := io.ReadAll(http.MaxBytesReader(c.Writer, c.Request.Body, indicaMaxBody))
	if err != nil || len(body) == 0 {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid_body"})
		return
	}
	sig := c.GetHeader("X-Indica-Signature")
	expected := hmacSHA256Hex(h.secret, body)
	if !hmac.Equal([]byte(sig), []byte(expected)) {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid_signature"})
		return
	}
	var req indicaFinalizadoRequest
	if err := json.Unmarshal(body, &req); err != nil {
		c.AbortWithStatusJSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid_json"})
		return
	}
	name := strings.TrimSpace(req.NomeFantasia)
	if name == "" {
		name = strings.TrimSpace(req.Company)
	}
	if name == "" {
		name = strings.TrimSpace(req.RazaoSocial)
	}
	if name == "" {
		c.AbortWithStatusJSON(http.StatusUnprocessableEntity, gin.H{"error": "company_name_required"})
		return
	}
	doc := auth.StripDocument(req.CNPJ)
	if err := auth.ValidateDocument("cnpj", doc); err != nil {
		c.AbortWithStatusJSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid_cnpj"})
		return
	}
	whatsapp := digitsOnlyString(req.WhatsApp)
	if len(whatsapp) < 10 || len(whatsapp) > 13 {
		c.AbortWithStatusJSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid_whatsapp"})
		return
	}
	categoryID := categoriaFromSegmento(req.Segmento)
	tier := certTierFromPlan(req.PlanID)

	logoURL := ""
	if strings.TrimSpace(req.Logo) != "" {
		saved, lerr := saveIndicaLogo(req.Logo)
		if lerr != nil {
			c.AbortWithStatusJSON(http.StatusUnprocessableEntity, gin.H{"error": "invalid_logo", "message": lerr.Error()})
			return
		}
		logoURL = saved
	}
	valorMensal := ""
	valorAnual := ""
	if req.PlanDetails.AnnualCents != nil {
		v := *req.PlanDetails.AnnualCents
		if v > 0 {
			valorAnual = brlFloat(&v)
			m := v / 12
			valorMensal = brlFloat(&m)
		}
	}
	vigencia := ""
	if req.PlanDetails.DurationMonths != nil {
		vigencia = fmt.Sprintf("%d meses", *req.PlanDetails.DurationMonths)
	}

	db := h.db.WithContext(c.Request.Context())
	var existing models.Seller
	findErr := db.Where("document = ? AND document_type = ?", doc, "cnpj").First(&existing).Error

	if errors.Is(findErr, gorm.ErrRecordNotFound) {
		nameFinal := uniqueSellerName(db, name)
		seller := &models.Seller{
			Name:                  nameFinal,
			CategoryID:            categoryID,
			Avatar:                firstRuneText(nameFinal),
			Description:           "",
			WhatsApp:              whatsapp,
			Link:                  strings.TrimSpace(req.Site),
			Instagram:             strings.TrimSpace(req.Instagram),
			Partner:               true,
			Highlight:             false,
			Rating:                0,
			ReviewsCount:          0,
			DocumentType:          "cnpj",
			Document:              doc,
			CertTier:              tier,
			SelfRegistered:        false,
			ContratoInicio:        strings.TrimSpace(req.PeriodStart),
			ContratoVigenciaMeses: vigencia,
			ValorMensal:           valorMensal,
			ValorAnual:            valorAnual,
			LogoURL:               logoURL,
		}
		if err := db.Create(seller).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusConflict, gin.H{"error": "failed_to_create_seller"})
			return
		}
		if err := replaceSellerCategories(db, seller, categoryID); err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed_to_set_seller_categories"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"status": "created", "seller_id": seller.ID})
		return
	}
	if findErr != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed_to_fetch_seller"})
		return
	}

	updates := map[string]any{
		"name":                    name,
		"avatar":                  firstRuneText(name),
		"category_id":             categoryID,
		"whats_app":               whatsapp,
		"partner":                 true,
		"cert_tier":               tier,
		"contrato_inicio":         strings.TrimSpace(req.PeriodStart),
		"contrato_vigencia_meses": vigencia,
		"valor_mensal":            valorMensal,
		"valor_anual":             valorAnual,
	}
	if site := strings.TrimSpace(req.Site); site != "" {
		updates["link"] = site
	}
	if ig := strings.TrimSpace(req.Instagram); ig != "" {
		updates["instagram"] = ig
	}
	if logoURL != "" {
		if existing.LogoURL != "" && existing.LogoURL != logoURL {
			removeUploadedFile(existing.LogoURL)
		}
		updates["logo_url"] = logoURL
	}
	if err := db.Model(&existing).Updates(updates).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_seller"})
		return
	}
	if err := replaceSellerCategories(db, &existing, categoryID); err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed_to_set_seller_categories"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "updated", "seller_id": existing.ID})
}
