"use client";

import { useEffect, useState } from "react";
import {
  ApiError,
  quotesApi,
  sellersApi,
  type AdminSeller,
  type ApiProduct,
  type SellerReview,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { ContactInput } from "@/hooks/use-whatsapp-history";

// Dados e ações do perfil público de uma empresa. Compartilhado entre o
// overlay mobile (SellerDetail) e a página desktop (/empresa/[id]) para a
// lógica de fetch, avaliações e contato viver num lugar só.
export function useSellerData(
  seller: AdminSeller,
  onRecordContact: (input: ContactInput) => void,
) {
  const [full, setFull] = useState<AdminSeller>(seller);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>(
    (seller.portfolio_photos ?? []).map((p) => p.url),
  );
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [myRating, setMyRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [myTags, setMyTags] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);
  // Eligibilidade "só quem contratou pode avaliar" — calculada pelo servidor
  // a partir dos pedidos fechados pelo app. null = ainda não sabemos (ou anônimo).
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const { isAuthenticated } = useAuth();

  const toggleTag = (t: string) =>
    setMyTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length < 4 ? [...prev, t] : prev,
    );

  // The list/slide payloads omit category and portfolio — fetch the full record.
  useEffect(() => {
    void sellersApi
      .get(seller.id)
      .then((res) => {
        setFull(res.seller);
        setProducts(res.products ?? []);
        setPortfolio((res.seller.portfolio_photos ?? []).map((p) => p.url));
      })
      .catch(() => {});
  }, [seller.id]);

  useEffect(() => {
    void sellersApi.listReviews(seller.id).then(setReviews).catch(() => {});
  }, [seller.id]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCanReview(null);
      return;
    }
    let alive = true;
    void quotesApi
      .eligibility(seller.id)
      .then((r) => {
        if (alive) setCanReview(r.can_review);
      })
      .catch(() => {
        if (alive) setCanReview(null);
      });
    return () => {
      alive = false;
    };
  }, [seller.id, isAuthenticated]);

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const ratingDist = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => r.rating === stars).length;
    return {
      stars,
      pct: reviews.length ? Math.round((count / reviews.length) * 100) : 0,
    };
  });

  async function submitReview() {
    if (myRating < 1 || sending) return;
    setSending(true);
    setReviewMsg(null);
    try {
      await sellersApi.createReview(seller.id, {
        rating: myRating,
        text: reviewText.trim(),
        tags: myTags.length ? myTags : undefined,
      });
      setReviewText("");
      setMyRating(0);
      setMyTags([]);
      setReviewMsg("Avaliação enviada. Obrigado!");
      setReviews(await sellersApi.listReviews(seller.id));
    } catch (err) {
      setReviewMsg(
        err instanceof ApiError && err.status === 403
          ? err.message
          : "Não foi possível enviar a avaliação. Tente novamente.",
      );
    } finally {
      setSending(false);
    }
  }

  // Multi-categoria: mostra todas as categorias da empresa, separadas por "·".
  const categoryLabel = full.categories?.length
    ? full.categories.map((c) => c.label).join(" · ")
    : (full.category?.label ?? "Empresa");

  function openWhatsapp() {
    const wa = (full.whatsapp ?? "").replace(/\D+/g, "");
    if (!wa) return;
    const msg = encodeURIComponent(
      "Olá! Encontrei vocês no Achadinhos do Condomínio.",
    );
    window.open(
      `https://wa.me/55${wa}?text=${msg}`,
      "_blank",
      "noopener,noreferrer",
    );
    onRecordContact({
      kind: "seller",
      targetId: full.id,
      name: full.name,
      avatar: full.name.charAt(0).toUpperCase(),
      logoUrl: full.logo_url,
      subtitle: full.category?.label ?? "Empresa",
      whatsapp: wa,
    });
  }

  function openSite() {
    if (full.link) {
      window.open(full.link, "_blank", "noopener,noreferrer");
    }
  }

  return {
    full,
    products,
    portfolio,
    reviews,
    avgRating,
    ratingDist,
    myRating,
    setMyRating,
    reviewText,
    setReviewText,
    sending,
    reviewMsg,
    submitReview,
    categoryLabel,
    openWhatsapp,
    openSite,
    canReview,
    myTags,
    toggleTag,
    isAuthenticated,
  };
}
