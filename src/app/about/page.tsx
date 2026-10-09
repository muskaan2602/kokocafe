import Image from "next/image";
import Link from "next/link";
import { Coffee, Heart, Leaf, Star, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-[#1A1108] py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/2 w-96 h-96 bg-[#BF4E19] rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          </div>
          <div className="relative max-w-3xl mx-auto px-4">
            <div className="w-16 h-16 bg-[#BF4E19] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-4">
              Our Story
            </h1>
            <p className="text-[#6B4C35] text-lg leading-relaxed">
              Born from a passion for great coffee and beautiful baking — KOKO
              is where community, craft, and comfort come together.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 bg-[#FAF3E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-4xl font-bold text-[#1A1108] mb-6">
                  Where it all began
                </h2>
                <p className="text-[#3D2B1A] leading-relaxed mb-4">
                  KOKO Café & Bakers started as a small bakery on Bakers Lane in
                  Bengaluru&apos;s Indiranagar. What began as a passion project quickly
                  became a neighbourhood institution.
                </p>
                <p className="text-[#3D2B1A] leading-relaxed mb-4">
                  We believed that great coffee and freshly baked goods deserved
                  a beautiful home. Every corner of KOKO is designed to make you
                  feel warm, welcome, and a little bit inspired.
                </p>
                <p className="text-[#3D2B1A] leading-relaxed">
                  Today, we serve hundreds of guests daily — from early morning
                  regulars to late evening studiers — and we bake everything from
                  scratch, every single day.
                </p>
              </div>
              <div className="relative">
                <Image
                  src="https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600"
                  alt="KOKO Café interior"
                  width={600}
                  height={500}
                  className="rounded-3xl object-cover w-full h-80"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-[#F2E6D0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-bold text-[#1A1108]">
                What we stand for
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Coffee,
                  title: "Craft & Quality",
                  desc: "Every cup is pulled with precision. Every bake is made with the finest ingredients. No shortcuts, ever.",
                },
                {
                  icon: Heart,
                  title: "Warmth & Welcome",
                  desc: "KOKO is a place for everyone. We believe great hospitality starts with a genuine smile.",
                },
                {
                  icon: Leaf,
                  title: "Fresh & Local",
                  desc: "We source from local farmers and bake fresh every morning. You can taste the difference.",
                },
              ].map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.title}
                    className="bg-white rounded-3xl p-6 shadow-sm text-center"
                  >
                    <div className="w-12 h-12 bg-[#BF4E19] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-[#1A1108] text-lg mb-2">
                      {v.title}
                    </h3>
                    <p className="text-[#6B4C35] text-sm leading-relaxed">{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-[#FAF3E8] text-center">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 bg-[#BF4E19] text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-[#A33D10] transition-colors"
          >
            Explore Our Menu <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
