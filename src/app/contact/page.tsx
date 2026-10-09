import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-[#1A1108] py-20 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h1 className="font-display text-5xl font-bold text-white mb-3">
              Find Us
            </h1>
            <p className="text-[#6B4C35] text-lg">
              We&apos;d love to see you in person. Come say hello.
            </p>
          </div>
        </section>

        <section className="py-20 bg-[#FAF3E8]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                {[
                  {
                    icon: MapPin,
                    title: "Address",
                    lines: ["12, Bakers Lane, Indiranagar,", "Bengaluru – 560038, Karnataka, India"],
                  },
                  {
                    icon: Phone,
                    title: "Phone",
                    lines: ["+91 80 1234 5678"],
                  },
                  {
                    icon: Mail,
                    title: "Email",
                    lines: ["hello@kokocafe.in"],
                  },
                  {
                    icon: Clock,
                    title: "Opening Hours",
                    lines: ["Mon – Fri: 8:00 AM – 10:00 PM", "Saturday: 8:00 AM – 11:00 PM", "Sunday: 9:00 AM – 10:00 PM"],
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-12 h-12 bg-[#BF4E19] rounded-2xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#1A1108] mb-1">{item.title}</h3>
                        {item.lines.map((l) => (
                          <p key={l} className="text-[#3D2B1A] text-sm">{l}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-[#F2E6D0] rounded-3xl h-80 flex items-center justify-center border border-[#E8D5B7]">
                <div className="text-center text-[#6B4C35]">
                  <MapPin className="w-16 h-16 mx-auto mb-3 text-[#BF4E19]" />
                  <p className="font-bold text-[#1A1108] text-lg">KOKO Café & Bakers</p>
                  <p className="text-sm mt-1">12, Bakers Lane, Indiranagar</p>
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
