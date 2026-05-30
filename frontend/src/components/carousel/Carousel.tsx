import { useState, useEffect } from 'react'

const SLIDES = [
  {
    image: 'https://picsum.photos/seed/book1/1200/400',
    title: 'Discover New Stories',
    subtitle: 'Curated books for every reader',
  },
  {
    image: 'https://picsum.photos/seed/book2/1200/400',
    title: 'Bestsellers Collection',
    subtitle: 'Top picks handpicked for you',
  },
  {
    image: 'https://picsum.photos/seed/book3/1200/400',
    title: 'Expand Your Library',
    subtitle: 'From classics to contemporary',
  },
]

export default function Carousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden rounded-xl bg-gray-100">
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold">{slide.title}</h2>
            <p className="text-white/80 mt-2 text-sm sm:text-base">{slide.subtitle}</p>
          </div>
        </div>
      ))}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition ${
              i === current ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
