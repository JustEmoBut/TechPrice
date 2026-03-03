interface Props {
  total: number;
  categoryLabel: string;
  isSearch: boolean;
  query: string;
}

export function HeroStats({ total, categoryLabel, isSearch, query }: Props) {
  const cards = [
    {
      label: isSearch ? "Arama Sonucu" : "Gösterilen Ürün",
      value: total.toLocaleString("tr-TR"),
      hint: isSearch ? `Sorgu: \"${query}\"` : categoryLabel,
    },
    {
      label: "Kaynak Mağaza",
      value: "3",
      hint: "İtopya / İnceHesap / Sinerji",
    },
    {
      label: "Tarama Modeli",
      value: "Haftalık",
      hint: "APScheduler + manuel tetikleme",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cards.map((card, index) => (
        <article
          key={card.label}
          className="glass-panel animate-rise rounded-xl p-4"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">{card.label}</p>
          <p className="mt-3 font-display text-2xl font-semibold text-ink">{card.value}</p>
          <p className="mt-1 text-xs text-ink-muted">{card.hint}</p>
        </article>
      ))}
    </div>
  );
}
