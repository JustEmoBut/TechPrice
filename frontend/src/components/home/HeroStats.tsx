interface Props {
  total: number;
  categoryLabel: string;
  isSearch: boolean;
  query: string;
}

export function HeroStats({ total, categoryLabel, isSearch, query }: Props) {
  const cards = [
    {
      label: isSearch ? "Bulunan Kayıt" : "Aktif Kayıt",
      value: total.toLocaleString("tr-TR"),
      hint: isSearch ? `"${query}" sorgusu` : categoryLabel,
    },
    {
      label: "Kaynak",
      value: "3",
      hint: "İtopya, İnceHesap, Sinerji",
    },
    {
      label: "Tarama",
      value: "Haftalık",
      hint: "Manuel tetikleme destekli",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card, index) => (
        <article
          key={card.label}
          className="control-surface animate-rise rounded-xl p-4"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">{card.label}</p>
          <p className="mt-3 font-display text-2xl font-semibold text-ink">{card.value}</p>
          <p className="mt-1 text-xs text-ink-muted">{card.hint}</p>
        </article>
      ))}
    </div>
  );
}
