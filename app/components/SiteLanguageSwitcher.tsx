"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Language = "ka" | "en";

const english: Record<string, string> = {
  "მთავარი": "Home", "უკან": "Back", "ყველა ტური": "All Tours", "ტურები": "Tours",
  "ტრანსფერები": "Transfers", "სასტუმროები": "Hotels", "გიდები": "Guides",
  "შესვლა": "Login", "რეგისტრაცია": "Create Account", "გასვლა": "Logout",
  "დამატება": "Add", "დადასტურება": "Confirm", "გაუქმება": "Cancel",
  "ძიება": "Search", "დალაგება": "Sort", "გასუფთავება": "Clear",
  "ფასი": "Price", "მინ. ფასი": "Min. price", "მაქს. ფასი": "Max. price",
  "მინიმალური ფასი": "Minimum price", "მაქსიმალური ფასი": "Maximum price",
  "მდებარეობა": "Location", "ყველა მდებარეობა": "All locations",
  "კატეგორია": "Category", "ყველა კატეგორია": "All categories",
  "სახელი და გვარი": "Full name", "ელფოსტა": "Email", "ტელეფონი": "Phone",
  "ტელეფონის ნომერი": "Phone / WhatsApp", "პაროლი": "Password",
  "პაროლი კიდევ ერთხელ": "Confirm password", "შეიყვანე პაროლი": "Enter password",
  "მინიმუმ 6 სიმბოლო": "At least 6 characters", "დაგავიწყდა პაროლი?": "Forgot password?",
  "აღდგენის ბმულის გაგზავნა": "Send recovery link", "წერილი იგზავნება...": "Sending...",
  "რეგისტრაცია მიმდინარეობს...": "Creating account...", "მიმდინარეობს შესვლა...": "Signing in...",
  "აღწერა": "Description", "ხანგრძლივობა": "Duration", "ადგილები": "Seats",
  "ოთახები": "Rooms", "ენები": "Languages", "გამოცდილება": "Experience",
  "ამინდი": "Weather", "საქართველო": "Georgia", "არ არის მითითებული": "Not specified",
  "მდებარეობა არ არის მითითებული": "Location not specified", "შეთანხმებით": "Contact for price",
  "ფასი შეთანხმებით": "Contact for price", "ფავორიტებში დამატება": "Add to favorites",
  "ფავორიტებიდან ამოღება": "Remove from favorites", "ტურის დეტალების ნახვა": "View tour details",
  "დაჯავშნა": "Booking", "დაჯავშნის ინფორმაცია": "Booking information",
  "დაჯავშნის მოთხოვნის გაგზავნა": "Send booking request", "მოთხოვნა იგზავნება...": "Sending request...",
  "მოთხოვნის გაგზავნა უფასოა": "Sending a request is free",
  "დაჯავშნა საბოლოოა მხოლოდ დადასტურების შემდეგ": "The booking is final only after confirmation",
  "სახელი, ადგილი, ტიპი...": "Name, location, type...", "ტური, ადგილი, აღწერა...": "Tour, location, description...",
  "სასტუმრო, ადგილი, ტელეფონი...": "Hotel, location, phone...",
  "მოძებნე გიდი, ადგილი ან ენა...": "Search by guide, location or language...",
  "დამტკიცებული ტურები ჯერ არ არის": "There are no approved tours yet",
  "დამტკიცებული სასტუმროები ჯერ არ არის": "There are no approved hotels yet",
  "შესაბამისი ტური ვერ მოიძებნა": "No matching tour was found",
  "შესაბამისი სასტუმრო ვერ მოიძებნა": "No matching hotel was found",
  "შეცვალე საძიებო სიტყვა ან გაასუფთავე ფილტრები.": "Change the search term or clear the filters.",
  "ტრანსფერები იტვირთება...": "Loading transfers...", "ტურები იტვირთება...": "Loading tours...",
  "სასტუმროები იტვირთება...": "Loading hotels...", "გიდები იტვირთება...": "Loading guides...",
  "უცნობი შეცდომა.": "An unknown error occurred.", "უცნობი შეცდომა დაფიქსირდა.": "An unknown error occurred.",
  "საიდან": "From", "სადამდე": "To", "მანქანა": "Vehicle", "მანქანის ტიპი": "Vehicle type",
  "👤 მგზავრები": "👤 Passengers", "🚗 მანქანის ტიპი": "🚗 Vehicle type", "🧳 ბარგი": "🧳 Luggage",
  "📍 ზუსტი Pickup": "📍 Exact pickup", "📍 ზუსტი Drop-off": "📍 Exact drop-off",
  "ადამიანების რაოდენობა": "Number of people", "მგზავრების რაოდენობა": "Number of passengers",
  "სტუმრების რაოდენობა": "Number of guests", "ოთახების რაოდენობა": "Number of rooms",
  "თარიღი": "Date", "დრო": "Time", "ტურის თარიღი": "Tour date",
  "შესვლის თარიღი": "Check-in date", "გასვლის თარიღი": "Check-out date",
  "დამატებითი შეტყობინება": "Special requests", "დამატებითი აქტივობები": "Additional activities",
  "მნიშვნელოვანი პირობები": "Important information", "წინასწარი დაჯავშნა": "Advance booking",
  "პროფესიონალი გიდის მომსახურება": "Professional guide service", "ტურის დროს მხარდაჭერა": "Support during the tour",
  "მარშრუტის დაგეგმვა": "Route planning", "კვება და სასმელი": "Food and drinks",
  "სასტუმროში განთავსება": "Hotel accommodation", "პირადი ხარჯები": "Personal expenses",
  "რა შეიძლება შედიოდეს ფასში": "What may be included", "რა შეიძლება არ შედიოდეს ფასში": "What may not be included",
  "ტურის ორგანიზატორი": "Tour organizer", "ტურის ორგანიზება": "Tour organization",
  "ტურის შეფასება": "Tour review", "შენი შეფასება": "Your review", "ჯერ არ არის შეფასება": "No reviews yet",
  "შეფასების დამატება": "Add review", "შეფასების შეცვლა": "Edit review", "შეფასების წაშლა": "Delete review",
  "შეფასების გაგზავნა": "Submit review", "შეფასების განახლება": "Update review",
  "დაწერე შენი გამოცდილების შესახებ...": "Write about your experience...",
  "ფასი ერთ ღამეზე": "Price per night", "ღამეების რაოდენობა": "Number of nights",
  "ტრანსფერი": "Transfer", "ტური": "Tour", "სასტუმრო": "Hotel", "მომხმარებელი": "User",
  "ინახება...": "Saving...", "იგზავნება...": "Sending...", "იშლება...": "Deleting...",
  "ხელახლა ცდა": "Try again", "ყველა ტრანსფერი": "All transfers", "ყველა სასტუმრო": "All hotels",
  "ნახვა და დაჯავშნა": "View and book", "დეტალების ნახვა": "View details", "ახლავე დაჯავშნა": "Book now"
};

function translateDocument() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(parent.tagName)) continue;
    const original = node.nodeValue ?? "";
    const trimmed = original.trim();
    const translated = english[trimmed];
    if (translated) node.nodeValue = original.replace(trimmed, translated);
  }

  document.querySelectorAll<HTMLElement>("[placeholder], [title], [aria-label]").forEach((element) => {
    for (const attribute of ["placeholder", "title", "aria-label"]) {
      const value = element.getAttribute(attribute)?.trim();
      if (value && english[value]) element.setAttribute(attribute, english[value]);
    }
  });
}

export default function SiteLanguageSwitcher() {
  const pathname = usePathname();
  const [language, setLanguage] = useState<Language>("ka");

  useEffect(() => {
    const saved = localStorage.getItem("site-language") === "en" ? "en" : "ka";
    setLanguage(saved);
    document.documentElement.lang = saved;
    if (saved === "en") {
      translateDocument();
      const observer = new MutationObserver(() => translateDocument());
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [pathname]);

  if (pathname === "/" || pathname.startsWith("/admin-v2") || pathname.startsWith("/dashboard")) return null;

  function changeLanguage(next: Language) {
    localStorage.setItem("site-language", next);
    setLanguage(next);
    window.location.reload();
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex rounded-2xl border border-white/20 bg-slate-950/95 p-1.5 text-sm font-black text-white shadow-2xl backdrop-blur-xl">
      <button type="button" onClick={() => changeLanguage("ka")} className={`rounded-xl px-3 py-2 ${language === "ka" ? "bg-cyan-500" : "hover:bg-white/10"}`} aria-label="ქართული">🇬🇪 KA</button>
      <button type="button" onClick={() => changeLanguage("en")} className={`rounded-xl px-3 py-2 ${language === "en" ? "bg-cyan-500" : "hover:bg-white/10"}`} aria-label="English">🇬🇧 EN</button>
    </div>
  );
}
