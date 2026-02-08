interface SummaryCardProps {
    title: string
    amount: string
    subtitle: string
    color: 'blue' | 'orange' | 'green'
}

export function SummaryCards({ cards }: { cards: SummaryCardProps[] }) {
    const colorStyles = {
        blue: { bg: 'bg-[#1080ec]', text: 'text-white' },
        orange: { bg: 'bg-[#f25605]', text: 'text-white' },
        green: { bg: 'bg-[#4bae00]', text: 'text-white' },
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {cards.map((card, index) => (
                <div key={index} className={`${colorStyles[card.color].bg} ${colorStyles[card.color].text} p-4 rounded-md shadow-sm relative overflow-hidden group`}>
                    <div className="relative z-10">
                        <h3 className="text-xs font-medium opacity-90 uppercase tracking-wide mb-0.5">{card.title}</h3>
                        <div className="text-2xl font-bold mb-0.5">{card.amount}</div>
                        <p className="text-[10px] opacity-80">{card.subtitle}</p>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white opacity-10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
                </div>
            ))}
        </div>
    )
}
