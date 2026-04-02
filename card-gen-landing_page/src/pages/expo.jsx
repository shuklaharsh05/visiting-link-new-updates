import { useState, useRef, useEffect } from "react";
import { apiService } from "../lib/api.js";

// Adjust these to position name and number on the pass image (percent of width/height, 0–1)
const PASS_TEXT = {
    name:  { x: 0.88, y: 0.71, fontSize: 26, font: "700 30px Poppins, sans-serif" },
    number: { x: 0.88, y: 0.785, fontSize: 20, font: "500 24px Poppins, sans-serif" },
};

const PASS_IMAGE_SRC = "/expo/pass.png";

// Event date: 28 Feb 2026, 10:00 AM
const EVENT_DATE = new Date(2026, 1, 28, 10, 0, 0, 0); // Feb = month 1

const getTimeLeft = () => {
    const now = new Date();
    const diffMs = EVENT_DATE - now;
    if (diffMs <= 0) return null;
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { days, hours, minutes, seconds };
};

// Parse "35" -> { value: 35, suffix: "" }, "10k" -> { value: 10, suffix: "k" }
const parseCountValue = (str) => {
    const match = String(str).trim().match(/^(\d+(?:\.\d+)?)\s*(k|K|M|m)?$/);
    if (!match) return { value: 0, suffix: "" };
    return { value: parseFloat(match[1]), suffix: (match[2] || "").toLowerCase() };
};

// Ease-out cubic for smooth deceleration at the end
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

function CountUp({ valueStr, duration = 1800 }) {
    const { value: target, suffix } = parseCountValue(valueStr);
    const [display, setDisplay] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (target <= 0) return;
        const el = ref.current;
        if (!el) {
            setStarted(true);
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started) setStarted(true);
            },
            { threshold: 0.2 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [target, started]);

    useEffect(() => {
        if (!started || target <= 0) return;
        let startTime = null;
        const tick = (now) => {
            if (startTime === null) startTime = now;
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(t);
            setDisplay(eased * target);
            if (t < 1) requestAnimationFrame(tick);
            else setDisplay(target);
        };
        const id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [started, target, duration]);

    const text = suffix === "k" ? `${Math.round(display)}${suffix}` : String(Math.round(display));

    return (
        <p ref={ref} className="text-2xl font-bold">
            {text}+
        </p>
    );
}

const BOOKMYSHOW_URL = "https://in.bookmyshow.com/events/bollywood-rang-concert-jhansi/ET00486745/ticket/CMCZ/10001";

export default function Expo() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(getTimeLeft);
    const [showPassModal, setShowPassModal] = useState(false);
    const [showVideoPopup, setShowVideoPopup] = useState(true);
    const [passDataUrl, setPassDataUrl] = useState(null);
    const canvasRef = useRef(null);
    const submitInProgressRef = useRef(false);

    useEffect(() => {
        const tick = () => setTimeLeft(getTimeLeft());
        tick();
        const id = setInterval(tick, 1000); // update every second
        return () => clearInterval(id);
    }, []);

    const drawPassWithText = (canvas, ctx, img) => {
        if (!canvas || !ctx || !img) return;
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0);
        ctx.fillStyle = "#111";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = PASS_TEXT.name.font;
        ctx.fillText(name || "—", w * PASS_TEXT.name.x, h * PASS_TEXT.name.y);
        ctx.font = PASS_TEXT.number.font;
        ctx.fillText(phone || "—", w * PASS_TEXT.number.x, h * PASS_TEXT.number.y);
    };

    useEffect(() => {
        if (!submitted || !canvasRef.current) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            drawPassWithText(canvas, ctx, img);
            setPassDataUrl(canvas.toDataURL("image/png"));
        };
        img.src = PASS_IMAGE_SRC;
    }, [submitted, name, phone]);

    useEffect(() => {
        if (submitted) setShowPassModal(true);
    }, [submitted]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !phone.trim()) return;
        if (submitInProgressRef.current || isSubmitting) return;
        submitInProgressRef.current = true;
        setIsSubmitting(true);
        try {
            const result = await apiService.submitExpoSubmission({ name: name.trim(), phone: phone.trim() });
            if (result?.success) {
                setSubmitted(true);
            } else {
                console.warn("Expo submission save failed:", result?.error);
            }
        } catch (err) {
            console.warn("Expo submission save failed:", err);
        } finally {
            submitInProgressRef.current = false;
            setIsSubmitting(false);
        }
    };

    const handleDownload = () => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            drawPassWithText(canvas, ctx, img);
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `expo-pass-${name.replace(/\s+/g, "-")}.png`;
                a.click();
                URL.revokeObjectURL(url);
            }, "image/png");
        };
        img.src = PASS_IMAGE_SRC;
    };

    return (
        <>
        {/* Fullscreen video popup */}
        {showVideoPopup && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
                role="dialog"
                aria-modal="true"
                aria-label="Expo video"
            >
                <button
                    type="button"
                    onClick={() => setShowVideoPopup(false)}
                    className="absolute top-4 right-4 text-white text-2xl font-semibold leading-none"
                    aria-label="Close video"
                >
                    ×
                </button>
                <div className="w-full max-w-5xl lg:aspect-video bg-white rounded-2xl overflow-hidden">
                    <video
                        src="/expo/popup-video.mp4"
                        autoPlay
                        controls
                        playsInline
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
        )}

        {/* Pass success modal: generated pass + BookMyShow */}
        {showPassModal && (
            <div
                className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60"
                onClick={() => setShowPassModal(false)}
                role="dialog"
                aria-modal="true"
                aria-label="Your visitor pass"
            >
                <div
                    className="bg-gradient-to-b from-[#000000] to-[#0E3253] max-w-[22rem] w-full flex flex-col items-center pt-12 pb-8 rounded-3xl px-4 relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <img src="/expo/bms.png" alt="expo-logo" className="absolute -top-6 left-1/2 -translate-x-1/2 w-40" />
                    </div>
                    <p className="text-base text-white mb-5 text-center">Collect, send & Share </p>
                    <p className="text-lg text-white mb-5 text-center">you won <span className="font-semibold"> 15% off</span> on Concert + Pannel Discussion Pass  </p>
                    <p className="text-3xl text-white mb-5 text-center italic">“Rotary15”</p>
                    <p className="text-xs text-white mb-1 text-center">Apply BookMyShow coupon code for discount on Concert Pass + Panel Discussion at Rs349 only 
                    </p>
                    <p className="text-xs text-white font-light mb-8 text-center">You can Get your Printed passes Offline too 
                    write Physical pass</p>
                    {passDataUrl ? (
                        <img
                            src={passDataUrl}
                            alt="Expo visitor pass"
                            className="w-full max-w-xs rounded-lg border border-gray-200 mb-4"
                        />
                    ) : (
                        <div className="w-full max-w-xs aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                            <span className="text-gray-500 text-sm">Loading pass…</span>
                        </div>
                    )}
                    {/* <p className="text-xs text-gray-600 text-center mb-4">Save this pass. Visitor pass will remain valid.</p> */}
                    <div className="flex gap-2 w-full max-w-xs mx-auto mt-2">
                        {/* <button
                            type="button"
                            onClick={handleDownload}
                            className="w-full bg-black text-white px-6 py-3 rounded-full font-medium"
                        >
                            Download Pass
                        </button> */}
                        <a
                            href={BOOKMYSHOW_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full max-w-xs mx-auto text-xs text-center flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-medium transition-colors "
                            onClick={() => apiService.recordExpoBookMyShowClick().catch(() => {})}
                        >
                            {/* <img src="/expo/book-my-show.png" alt="" className="h-6 object-contain" /> */}
                            BookMyShow @15% OFF
                        </a>
                        <button
                            type="button"
                            onClick={handleDownload}
                            className=" min-w-[120px] text-white text-sm bg-black px-4 py-2 rounded-full font-medium transition-colors"
                        >
                            Download
                        </button>
                    </div>

                    <p className="text-center text-[13px] text-white mt-6"><a href="https://wa.me/919236553585" target="_blank" rel="noopener noreferrer" className="text-white underline">For any queries Whatsapp us at +91 9236553585</a></p>
                </div>
            </div>
        )}

        <div className="bg-gray-300 flex flex-col items-center justify-center">
            <div className="max-w-96 w-full h-full bg-white rounded-2xl overflow-hidden shadow-lg flex flex-col gap-8 px-4 pt-6 pb-8" style={{background: "linear-gradient(to bottom, #ffffff 50%, #030A10 90%)"}}>


            <div className="mt-6 mb-4">
                    <p className="text-center text-xl font-bold text-black mb-5">Book your tickets Now</p>
                    {timeLeft === null ? (
                        <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-[#000000] to-[#48C44F] text-center px-2">
                            Event is live now. Come join us!
                        </p>
                    ) : (
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem] px-2 py-2 rounded-xl bg-black/10 border border-black/20">
                                <span className="text-2xl font-bold tabular-nums text-black">{String(timeLeft.days).padStart(2, "0")}</span>
                                <span className="text-[10px] font-medium text-black/70 uppercase tracking-wider">Days</span>
                            </div>
                            <span className="text-xl font-bold text-black/50 self-end pb-5">:</span>
                            <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem] px-2 py-2 rounded-xl bg-black/10 border border-black/20">
                                <span className="text-2xl font-bold tabular-nums text-black">{String(timeLeft.hours).padStart(2, "0")}</span>
                                <span className="text-[10px] font-medium text-black/70 uppercase tracking-wider">Hours</span>
                            </div>
                            <span className="text-xl font-bold text-black/50 self-end pb-5">:</span>
                            <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem] px-2 py-2 rounded-xl bg-black/10 border border-black/20">
                                <span className="text-2xl font-bold tabular-nums text-black">{String(timeLeft.minutes).padStart(2, "0")}</span>
                                <span className="text-[10px] font-medium text-black/70 uppercase tracking-wider">Mins</span>
                            </div>
                            <span className="text-xl font-bold text-black/50 self-end pb-5">:</span>
                            <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem] px-2 py-2 rounded-xl bg-black/10 border border-black/20">
                                <span className="text-2xl font-bold tabular-nums text-black ">{String(timeLeft.seconds).padStart(2, "0")}</span>
                                <span className="text-[10px] font-medium text-black/70 uppercase tracking-wider">Secs</span>
                            </div>
                        </div>
                    )}
                </div>

            <section className="bg-gray-200 p-4 rounded-2xl">
                    <p className="text-center text-xl font-bold">28-01 FEB to MAR 2026</p>
                    <p className="text-center text-[19px] my-0.5 font-bold text-red-700">10:00 Am onward </p>
                    <p className="text-center text-base">Urban Haat Behind Deen Dayal Sabhagar </p>
                </section>

                 <section className="flex flex-col items-center gap-3">
                    <img src="/expo/clients.png" alt="expo-logo" className="w-60 mx-auto mt-2 mb-4" />
                    <div>
                    <p className="text-center text-xl font-bold">Free Pass For EXPO</p>
                    <p className="text-center text-xs">Network & Grow Together</p>
                    </div>
 
                    <form onSubmit={handleSubmit} className="max-w-72 mx-auto mt-3">
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border-2 border-gray-400 rounded-full px-3 py-2 text-sm"
                            required
                        />
                        <input
                            type="tel"
                            placeholder="Enter your phone number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full border-2 border-gray-400 rounded-full px-3 py-2 text-sm mt-2"
                            required
                        />
                        {!submitted ? (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-black text-white px-6 py-2 rounded-full font-medium w-full mt-4 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Submitting…" : "Submit"}
                            </button>
                        ) : null}
                    </form>

                    {!submitted ? (
                        <></>
                    ) : (
                        <canvas
                            ref={canvasRef}
                            className="w-full max-w-xs mx-auto my-4 block rounded-lg border border-gray-200"
                        />
                    )}
                    {submitted ? (
                        <p className="text-center text-xs text-gray-600">You can Download this and come to us <br /> <span className="text-gray-800 text-[13px] font-medium">Visitor pass Will be remain valid</span></p>
                    ) : 
                    (
                        <p className="text-center text-xs text-gray-600">Submit your details to get your free visitor pass</p>
                    )}
                    {submitted && (
                        <button type="button" onClick={handleDownload} className="bg-black text-white px-6 py-2 rounded-full font-medium">
                            Download
                        </button>
                    )}
                </section>
                {/* Header / branding */}
                <section className="flex flex-col items-center gap-3">
                    
                    <div className="relative w-full max-w-4xl mx-auto mt-2" style={{ paddingBottom: "120%" }}>
                        <iframe width="383" height="680" src="https://www.youtube.com/embed/hBDzAvYFrJw" title="Get Ready jhansi , EXPO is comming" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="absolute top-0 left-0 w-full h-full rounded-lg"></iframe>
                    </div>
                    {/* https://www.instagram.com/reels/DVAl56eEoNg/ */}
                    <img src="/expo/logos.png" alt="expo-logo" className="w-full h-full object-cover mt-2" />
                    <img src="/expo/expo-logo.png" alt="expo-logo" className="w-60 mx-auto mt-4" />
                    <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-l from-black to-[#004DFF] mt-2 mb-0">BUNDELKHAND <br /> VENTURE SUMMIT 2026</h1>
                </section>

                <section className="flex flex-col gap-3">

                    <img src="/expo/sanfran.png" alt="expo-logo" className="w-36 mx-auto" />
                    <img src="/expo/sponsers.png" alt="expo-logo" className="w-full h-full object-cover" />

                    <div className="grid grid-cols-3 gap-4 mt-6 mb-10">
                        {[
                            {
                                Number: "35",
                                Description: "Investors"
                            },
                            {
                                Number: "50",
                                Description: "Stalls (MSMEs)"
                            },
                            {
                                Number: "10k",
                                Description: "Audience"
                            }
                        ]
                        .map((item, index) => (
                            <div key={index} className="flex flex-col items-center justify-center">
                                <CountUp valueStr={item.Number} duration={1800} />
                                <p className="text-[11px] mt-1 text-black font-medium">{item.Description}</p>
                            </div>
                        ))
                    }
                    </div>
                    <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-l from-black to-[#004DFF]">First Time In <br /> Bundelkhand jhansi</h1>
                    <p className="text-center text-sm text-gray-700">Bundelkhand's largest startup & business event happening in Jhansi, bringing startups, MSMEs, investors, industry leaders, and government representatives together on one platform.</p>
                </section>

                <section className="grid grid-cols-3 items-start justify-center gap-4">
                {
                    [{
                        image: "/expo/1.png",
                        text: "Discover Business Opportunities"
                    },
                    {
                        image: "/expo/2.png",
                        text: "Connect with Investors & Leaders"
                    },
                    {
                        image: "/expo/3.png",
                        text: "Learn from Industry Experts"
                    },
                    ].map((item, index) => (
                            <div key={index} className="flex flex-col gap-2">
                            <img src={item.image} alt={item.text} className="w-full h-full object-contain" />
                            <p className="text-center text-xs">{item.text}</p>
                            </div>
                    ))
                }
                </section>

                

                <section className="flex flex-col gap-3">
               
                </section>

               

                <section className="flex flex-col gap-3 mt-4">
                     <div
                      className="relative w-full max-w-4xl mx-auto mb-12"
                      style={{ paddingBottom: "56.25%" }}
                    >
                    <iframe width="946" height="532" src="https://www.youtube.com/embed/CTv4l47QsmQ" title="Bundelkhand… ready ho jao" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="absolute top-0 left-0 w-full h-full rounded-2xl"></iframe>
                    </div>
                    <img src="/expo/concert-img.png" alt="expo-logo" className="w-full h-full object-cover" />
                    <p className="text-center text-xl font-bold text-yellow-400 mt-4">Popular Bollywood Dance Hits (2017–2025)</p>
                    <p className="text-center text-lg font-bold text-white">Title & Major Film Tracks</p>
                    <ul className="list-disc pl-6 text-xs space-y-1 text-white">
                    <li>Badri Ki Dulhania (Title Track) — Badrinath Ki Dulhania (2017)</li>
                    <li>Chalti Hai Kya 9 Se 12 — Judwaa 2 (2017)</li>
                    <li>Kusu Kusu — Satyameva Jayate 2 (2021)</li>
                    <li>Sweety Tera Drama — Bareilly Ki Barfi (2017)</li>
                    <li>Rangtaari — Loveyatri (2018)</li>
                    <li>Sweetheart — Kedarnath (2018)</li>
                    <li>Heart Throb — Rocky Aur Rani Kii Prem Kahaani (2023)</li>
                    <li>Naach Meri Jaan — Tubelight (2017)</li>
                </ul>

                <a
                    href="https://in.bookmyshow.com/events/bollywood-rang-concert-jhansi/ET00486745/ticket/CMCZ/10001"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 mb-4"
                    onClick={() => apiService.recordExpoBookMyShowClick().catch(() => {})}
                >
                    <img src="/expo/book-my-show.png" alt="expo-logo" className="w-60 mx-auto" />
                </a>

                {/* <p className="text-center text-xs text-white">OR Get Tickets from </p>
                <a
                    href="https://rzp.io/rzp/2QdeHpRb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-4"
                    onClick={() => apiService.recordExpoRazorpayClick().catch(() => {})}
                >
                    <img src="/expo/razorpay.png" alt="expo-logo" className="w-60 mx-auto" />
                </a> */}

{/* 
                <ul className="list-decimal pl-6 text-sm space-y-1 text-white">
                    <li>Click & Pay</li>
                    <li>Complete the Payment</li>
                    <li>Take a Payment Screenshot</li>
                    <li>Share the Screenshot on WhatsApp</li>
                    
                </ul> */}


               
                </section>

                <p className="text-center text-xs text-white flex items-center justify-center gap-2">Powered by <img src="/visitingLink-logo-white.png" alt="expo-logo" className="w-20" /></p>

            </div>

        </div>
        </>
    )
}