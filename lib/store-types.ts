export type MarketOrderLike = {
  id: string;
  sellerName: string;
  storeName: string;
  lines: { title: string; quantity: number }[];
  deliveryFee: number;
  fulfillment: "ritiro" | "consegna-interna" | "express" | "spedizione";
  address: string;
  deliverySlot: string;
  status: "richiesto" | "confermato" | "in-preparazione" | "in-consegna" | "consegnato" | "annullato";
  createdAt: string;
};
