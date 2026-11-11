// Package email sends transactional emails via Resend (resend.com).
//
// When the API key or the sender address is empty the Client is "disabled":
// SendWelcome becomes a no-op that returns nil, so the rest of the app keeps
// working without email configured (useful for local dev / tests / first
// deploy before the secret is set).
package email

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const endpoint = "https://api.resend.com/emails"

// Client talks to the Resend HTTP API.
type Client struct {
	apiKey string
	from   string
	http   *http.Client
}

// NewClient builds a Client. If apiKey or from is empty the client is
// disabled (Enabled() reports false; SendWelcome is a no-op).
func NewClient(apiKey, from string) *Client {
	return &Client{
		apiKey: apiKey,
		from:   from,
		http:   &http.Client{Timeout: 10 * time.Second},
	}
}

// Enabled reports whether the client is configured to actually send mail.
func (c *Client) Enabled() bool {
	return c != nil && c.apiKey != "" && c.from != ""
}

// SendWelcome sends a one-shot "welcome to Achadinhos" email to a newly
// registered síndico. Best-effort — the caller should treat the error as a
// warning and never let it block a request.
func (c *Client) SendWelcome(ctx context.Context, toEmail, name string) error {
	if !c.Enabled() {
		return nil
	}
	greet := name
	if greet == "" {
		greet = "síndico(a)"
	}
	subject := "Bem-vindo(a) ao Achadinhos do Condomínio"
	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0; padding:0; background:#FBF8F2; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#1a1410;">
  <div style="max-width:520px; margin:0 auto; padding:24px;">
    <div style="background:#fff; border-radius:18px; padding:32px 28px; box-shadow:0 4px 24px rgba(11,27,59,0.06);">
      <h1 style="margin:0 0 14px; font-size:22px; color:#0b1b3b;">Olá, %s — bem-vindo(a)! 👋</h1>
      <p style="margin:0 0 14px; line-height:1.6; font-size:15px;">
        Sua conta no <strong>Achadinhos do Condomínio</strong> foi criada com sucesso.
      </p>
      <p style="margin:0 0 14px; line-height:1.6; font-size:15px;">
        Aqui você encontra prestadores verificados, empresas parceiras e produtos para o seu condomínio — com orçamento em 1 toque no WhatsApp.
      </p>
      <p style="margin:24px 0 0;">
        <a href="https://achadinhoscondominio.com.br" style="display:inline-block; background:linear-gradient(140deg,#d9bc78,#c9a961); color:#0b1b3b; padding:12px 22px; border-radius:12px; text-decoration:none; font-weight:700;">Abrir o app</a>
      </p>
      <p style="margin:28px 0 0; color:#7a6d55; font-size:12.5px; line-height:1.5;">
        Se você não criou essa conta, pode ignorar este e-mail.
      </p>
    </div>
    <p style="text-align:center; color:#a89c82; font-size:11.5px; margin-top:18px;">
      Achadinhos do Condomínio · achadinhoscondominio.com.br
    </p>
  </div>
</body>
</html>`, greet)
	text := fmt.Sprintf(
		"Olá, %s — bem-vindo(a) ao Achadinhos do Condomínio!\n\n"+
			"Sua conta foi criada com sucesso. Abra o app em https://achadinhoscondominio.com.br\n\n"+
			"Se você não criou essa conta, pode ignorar este e-mail.",
		greet,
	)
	payload := map[string]any{
		"from":    c.from,
		"to":      []string{toEmail},
		"subject": subject,
		"html":    htmlBody,
		"text":    text,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("resend %d: %s", res.StatusCode, string(b))
	}
	return nil
}

// send POSTs a single transactional email through Resend. Shared by the typed
// helpers so the HTTP/JSON boilerplate lives in one place.
func (c *Client) send(ctx context.Context, toEmail, subject, htmlBody, text string) error {
	payload := map[string]any{
		"from":    c.from,
		"to":      []string{toEmail},
		"subject": subject,
		"html":    htmlBody,
		"text":    text,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("resend %d: %s", res.StatusCode, string(b))
	}
	return nil
}

// SendFichaCadastro sends the company onboarding form ("ficha de cadastro")
// link to the responsável. Best-effort — caller treats the error as a warning.
func (c *Client) SendFichaCadastro(ctx context.Context, toEmail, name, link string) error {
	if !c.Enabled() {
		return nil
	}
	greet := name
	if greet == "" {
		greet = "responsável"
	}
	subject := "Complete o cadastro da sua empresa - Achadinhos do Condomínio"
	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
<html lang="pt-BR">
<body style="margin:0; padding:0; background:#FBF8F2; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#1a1410;">
  <div style="max-width:520px; margin:0 auto; padding:24px;">
    <div style="background:#fff; border-radius:18px; padding:32px 28px; box-shadow:0 4px 24px rgba(11,27,59,0.06);">
      <h1 style="margin:0 0 14px; font-size:22px; color:#0b1b3b;">Olá, %s 👋</h1>
      <p style="margin:0 0 14px; line-height:1.6; font-size:15px;">
        Você foi convidado(a) a preencher a <strong>ficha de cadastro</strong> da sua empresa no <strong>Achadinhos do Condomínio</strong>.
      </p>
      <p style="margin:0 0 14px; line-height:1.6; font-size:15px;">
        É rápido: basta clicar no botão abaixo e completar os dados do responsável e da empresa.
      </p>
      <p style="margin:24px 0 0;">
        <a href="%s" style="display:inline-block; background:linear-gradient(140deg,#d9bc78,#c9a961); color:#0b1b3b; padding:12px 22px; border-radius:12px; text-decoration:none; font-weight:700;">Preencher ficha de cadastro</a>
      </p>
      <p style="margin:18px 0 0; line-height:1.5; font-size:12.5px; color:#7a6d55;">
        Se o botão não funcionar, copie e cole este link no navegador:<br>
        <a href="%s" style="color:#0b1b3b; word-break:break-all;">%s</a>
      </p>
      <p style="margin:28px 0 0; color:#7a6d55; font-size:12.5px; line-height:1.5;">
        Se você não esperava este e-mail, pode ignorá-lo.
      </p>
    </div>
    <p style="text-align:center; color:#a89c82; font-size:11.5px; margin-top:18px;">
      Achadinhos do Condomínio · achadinhoscondominio.com.br
    </p>
  </div>
</body>
</html>`, greet, link, link, link)
	text := fmt.Sprintf(
		"Olá, %s!\n\n"+
			"Você foi convidado(a) a preencher a ficha de cadastro da sua empresa no Achadinhos do Condomínio.\n\n"+
			"Preencha aqui: %s\n\n"+
			"Se você não esperava este e-mail, pode ignorá-lo.",
		greet, link,
	)
	payload := map[string]any{
		"from":    c.from,
		"to":      []string{toEmail},
		"subject": subject,
		"html":    htmlBody,
		"text":    text,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	res, err := c.http.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("resend %d: %s", res.StatusCode, string(b))
	}
	return nil
}
