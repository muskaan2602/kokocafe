import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Coffee, Star, MapPin, Clock, QrCode, ChevronRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const featuredItems = [
  {
    name: "Caramel Latte",
    description: "Espresso with caramel and velvety steamed milk",
    price: "₹200",
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600",
    veg: true,
  },
  {
    name: "Butter Croissant",
    description: "Golden, flaky, buttery perfection every morning",
    price: "₹80",
    category: "Bakery",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600",
    veg: true,
  },
  {
    name: "Chocolate Brownie",
    description: "Dense, fudgy dark chocolate brownie with crispy top",
    price: "₹160",
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600",
    veg: true,
  },
  {
    name: "Avocado Toast",
    description: "Smashed avocado on sourdough with cherry tomatoes",
    price: "₹220",
    category: "Breakfast",
    image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=600",
    veg: true,
  },
  {
    name: "Iced Caramel Latte",
    description: "Cold espresso with caramel over ice",
    price: "₹210",
    category: "Cold Beverages",
    image: "https://images.unsplash.com/photo-1582650625119-3a31f8fa2699?w=600",
    veg: true,
  },
  {
    name: "Tiramisu",
    description: "Classic Italian dessert with mascarpone cream",
    price: "₹200",
    category: "Desserts",
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600",
    veg: true,
  },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",
  "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400",
  "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400",
];

const reviews = [
  {
    name: "Priya M.",
    rating: 5,
    review: "The coffee here is absolutely divine! The ambiance is cozy and perfect for working or just relaxing.",
    avatar: "P",
  },
  {
    name: "Rahul K.",
    rating: 5,
    review: "Best croissants in the city. The QR ordering system made the whole experience so smooth and effortless.",
    avatar: "R",
  },
  {
    name: "Ananya S.",
    rating: 5,
    review: "KOKO is my go-to spot. The chocolate brownie paired with a cappuccino is pure heaven!",
    avatar: "A",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── HERO ── */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-[#2B1B14]">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600"
              alt="KOKO Café interior"
              fill
              priority
              className="object-cover opacity-30"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2B1B14]/80 via-[#2B1B14]/60 to-transparent" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[#E86A2A]/20 border border-[#E86A2A]/40 rounded-full px-4 py-1.5 mb-6">
                <Coffee className="w-4 h-4 text-[#E86A2A]" />
                <span className="text-[#E86A2A] text-sm font-medium">
                  Now open · Indiranagar, Bengaluru
                </span>
              </div>

              <h1 className="font-display text-white text-6xl sm:text-7xl lg:text-8xl font-bold leading-none mb-2">
                KOKO
              </h1>
              <h2 className="font-display text-[#E86A2A] text-3xl sm:text-4xl font-semibold mb-6">
                CAFÉ & BAKERS
              </h2>
              <p className="text-[#F5EBDD]/80 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
                Freshly brewed. Freshly baked. Made for you. Every cup, every
                bite — crafted with love in Bengaluru&apos;s favourite café.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/menu"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#E86A2A] text-white rounded-2xl text-base font-semibold hover:bg-[#C94F16] transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  Explore Menu <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/order"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-2xl text-base font-semibold hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  <QrCode className="w-5 h-5" /> Order from Table
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
                {[
                  { value: "50+", label: "Menu items" },
                  { value: "4.9", label: "Rating" },
                  { value: "2,000+", label: "Happy customers" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-[#8B5E44]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
            <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/40" />
          </div>
        </section>

        {/* ── ABOUT STRIP ── */}
        <section className="bg-[#E86A2A] py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-8 text-white text-sm font-medium">
              {[
                "☕ Specialty Coffee",
                "🥐 Fresh-baked Daily",
                "📱 Scan & Order",
                "🌿 Vegetarian Options",
                "⚡ Fast Service",
              ].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── ABOUT SECTION ── */}
        <section className="py-20 bg-[#FFF7ED]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-[#F5EBDD] text-[#E86A2A] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                  Our Story
                </div>
                <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#2B1B14] mb-6 leading-tight">
                  More than just a café
                </h2>
                <p className="text-[#5C3D2E] text-lg leading-relaxed mb-6">
                  KOKO was born from a simple dream — to create a space where
                  great coffee meets beautiful baked goods, and where every
                  guest feels like they&apos;re coming home.
                </p>
                <p className="text-[#5C3D2E] leading-relaxed mb-8">
                  From our hand-roasted beans to our butter-laminated croissants,
                  everything is made with care, intention, and a deep love for the
                  craft. We source locally, bake fresh daily, and brew with precision.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-[#E86A2A] font-semibold hover:gap-3 transition-all"
                >
                  Read our story <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Image
                  src="https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400"
                  alt="KOKO café ambiance"
                  width={300}
                  height={400}
                  className="rounded-2xl object-cover w-full h-64"
                />
                <div className="flex flex-col gap-4">
                  <Image
                    src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400"
                    alt="Coffee being brewed"
                    width={300}
                    height={200}
                    className="rounded-2xl object-cover w-full h-28"
                  />
                  <Image
                    src="https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400"
                    alt="Fresh pastries"
                    width={300}
                    height={200}
                    className="rounded-2xl object-cover w-full h-28"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURED MENU ── */}
        <section className="py-20 bg-[#F5EBDD]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-block bg-[#FFF7ED] text-[#E86A2A] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Popular Picks
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#2B1B14] mb-4">
                KOKO Favourites
              </h2>
              <p className="text-[#5C3D2E] text-lg max-w-xl mx-auto">
                Handpicked by our regulars — the items that keep people coming back.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <div
                  key={item.name}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className="relative h-52 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 text-[#E86A2A] text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {item.category}
                    </div>
                    {item.veg && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-white rounded border-2 border-green-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-[#2B1B14] text-lg mb-1">
                      {item.name}
                    </h3>
                    <p className="text-[#8B5E44] text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#E86A2A] font-bold text-xl">
                        {item.price}
                      </span>
                      <Link
                        href="/menu"
                        className="px-4 py-2 bg-[#FFF7ED] text-[#E86A2A] rounded-xl text-sm font-semibold hover:bg-[#E86A2A] hover:text-white transition-colors"
                      >
                        View Menu
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#E86A2A] text-white rounded-2xl font-semibold hover:bg-[#C94F16] transition-all shadow-md hover:shadow-lg"
              >
                View Full Menu <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── QR ORDER CTA ── */}
        <section className="py-20 bg-[#2B1B14] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E86A2A] rounded-full -translate-y-1/2 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#E86A2A] rounded-full translate-y-1/2 blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 bg-[#E86A2A] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <QrCode className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Scan. Order. Enjoy.
            </h2>
            <p className="text-[#8B5E44] text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Find the QR code on your table, scan it, and order from your phone.
              No apps, no accounts, no waiting.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              {[
                { icon: "📱", step: "1", text: "Scan the QR code on your table" },
                { icon: "🛍️", step: "2", text: "Browse and add items to cart" },
                { icon: "✅", step: "3", text: "Place order. We bring it to you!" },
              ].map((s) => (
                <div
                  key={s.step}
                  className="bg-white/5 rounded-2xl p-6 border border-white/10"
                >
                  <div className="text-3xl mb-3">{s.icon}</div>
                  <div className="w-6 h-6 bg-[#E86A2A] rounded-full text-white text-xs font-bold flex items-center justify-center mx-auto mb-2">
                    {s.step}
                  </div>
                  <p className="text-[#F5EBDD] text-sm">{s.text}</p>
                </div>
              ))}
            </div>
            <Link
              href="/order"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#E86A2A] text-white rounded-2xl font-semibold text-lg hover:bg-[#C94F16] transition-all shadow-lg hover:shadow-xl animate-pulse-orange"
            >
              <QrCode className="w-5 h-5" /> Order from Your Table
            </Link>
          </div>
        </section>

        {/* ── GALLERY ── */}
        <section className="py-20 bg-[#FFF7ED]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-block bg-[#F5EBDD] text-[#E86A2A] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Gallery
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#2B1B14]">
                The KOKO Experience
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((src, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl group"
                  style={{ height: i % 3 === 1 ? "280px" : "220px" }}
                >
                  <Image
                    src={src}
                    alt={`KOKO café gallery ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-[#2B1B14]/0 group-hover:bg-[#2B1B14]/20 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REVIEWS ── */}
        <section className="py-20 bg-[#F5EBDD]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-block bg-[#FFF7ED] text-[#E86A2A] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Reviews
              </div>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#2B1B14]">
                What our guests say
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div key={r.name} className="bg-white p-6 rounded-3xl shadow-sm">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#E86A2A] text-[#E86A2A]" />
                    ))}
                  </div>
                  <p className="text-[#5C3D2E] mb-4 leading-relaxed italic">
                    &ldquo;{r.review}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#E86A2A] rounded-full text-white flex items-center justify-center font-semibold text-sm">
                      {r.avatar}
                    </div>
                    <span className="font-semibold text-[#2B1B14] text-sm">
                      {r.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LOCATION ── */}
        <section className="py-20 bg-[#FFF7ED]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-[#F5EBDD] text-[#E86A2A] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                  Location
                </div>
                <h2 className="font-display text-4xl font-bold text-[#2B1B14] mb-6">
                  Come visit us
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#E86A2A] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#2B1B14]">Address</div>
                      <div className="text-[#5C3D2E]">
                        12, Bakers Lane, Indiranagar,
                        <br />
                        Bengaluru – 560038, Karnataka
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#E86A2A] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#2B1B14]">Hours</div>
                      <div className="text-[#5C3D2E]">Mon – Fri: 8 AM – 10 PM</div>
                      <div className="text-[#5C3D2E]">Sat: 8 AM – 11 PM</div>
                      <div className="text-[#5C3D2E]">Sun: 9 AM – 10 PM</div>
                    </div>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-[#E86A2A] text-white rounded-xl font-semibold hover:bg-[#C94F16] transition-colors"
                >
                  Get Directions <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="bg-[#F5EBDD] rounded-3xl h-72 flex items-center justify-center border border-[#E8D5C0]">
                <div className="text-center text-[#8B5E44]">
                  <MapPin className="w-12 h-12 mx-auto mb-3 text-[#E86A2A]" />
                  <p className="font-semibold text-[#2B1B14]">KOKO Café & Bakers</p>
                  <p className="text-sm">12, Bakers Lane, Indiranagar</p>
                  <p className="text-sm">Bengaluru – 560038</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
