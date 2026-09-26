"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 5;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function AddTourPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [userId, setUserId] = useState("");
  const [checkingUser, setCheckingUser] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [priceOption, setPriceOption] = useState<
    "negotiable" | "GEL" | "USD"
  >("negotiable");
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [maxPeople, setMaxPeople] = useState("");
  const [category, setCategory] = useState("");

  const [cancellationPolicy, setCancellationPolicy] =
    useState<"24_hours" | "3_days" | "7_days" | "14_days">("24_hours");

  const cancellationFeePercent =
    cancellationPolicy === "24_hours"
      ? 100
      : cancellationPolicy === "3_days"
        ? 50
        : cancellationPolicy === "7_days"
          ? 30
          : 20;

  const [horseExperienceLevel, setHorseExperienceLevel] =
    useState("");
  const [horseDifficulty, setHorseDifficulty] =
    useState("");
  const [horseMinAge, setHorseMinAge] = useState("");
  const [horseMaxAge, setHorseMaxAge] = useState("");
  const [horseDurationHours, setHorseDurationHours] =
    useState("");
  const [horseRouteKm, setHorseRouteKm] = useState("");
  const [horseHelmetIncluded, setHorseHelmetIncluded] =
    useState(false);
  const [horseBeginnerFriendly, setHorseBeginnerFriendly] =
    useState(false);
  const [horseGuideIncluded, setHorseGuideIncluded] =
    useState(true);
  const [horseChoiceAvailable, setHorseChoiceAvailable] =
    useState(false);
  const [horseMaxWeightKg, setHorseMaxWeightKg] =
    useState("");
  const [horseSafetyInfo, setHorseSafetyInfo] = useState("");
  const [
    horseGuestRequirements,
    setHorseGuestRequirements,
  ] = useState("");

  const [contactPhone, setContactPhone] = useState("");
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasViber, setHasViber] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const isHorseRiding =
    category === "Horse Riding";

  useEffect(() => {
    async function checkUser() {
      setCheckingUser(true);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session loading error:", sessionError);
      }

      let authenticatedUser = session?.user ?? null;

      if (!authenticatedUser) {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("User loading error:", userError);
        }

        authenticatedUser = user;
      }

      if (!authenticatedUser) {
        router.replace("/login");
        return;
      }

      setUserId(authenticatedUser.id);

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("phone")
          .eq("id", authenticatedUser.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "Profile phone loading error:",
          profileError
        );
      }

      if (profile?.phone) {
        setContactPhone(profile.phone);
      }

      setCheckingUser(false);
    }

    checkUser();
  }, [router, supabase]);

  useEffect(() => {
    const urls = imageFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) =>
        URL.revokeObjectURL(url)
      );
    };
  }, [imageFiles]);

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    setMessage("");

    const selectedFiles = Array.from(
      event.target.files ?? []
    );

    if (selectedFiles.length === 0) {
      return;
    }

    for (const file of selectedFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setMessage(
          "áƒ¨áƒ”áƒ’áƒ˜áƒ«áƒšáƒ˜áƒ áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ áƒ›áƒ®áƒáƒšáƒáƒ“ JPG, PNG áƒáƒœ WEBP áƒ¤áƒáƒ¢áƒáƒ”áƒ‘áƒ˜."
        );
        setMessageType("error");
        event.target.value = "";
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setMessage(
          `áƒ¤áƒáƒ¢áƒ "${file.name}" 10 MB-áƒ–áƒ” áƒ›áƒ”áƒ¢áƒ˜áƒ.`
        );
        setMessageType("error");
        event.target.value = "";
        return;
      }
    }

    setImageFiles((currentFiles) => {
      const combined = [...currentFiles];

      selectedFiles.forEach((file) => {
        const alreadyExists = combined.some(
          (existingFile) =>
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.lastModified === file.lastModified
        );

        if (
          !alreadyExists &&
          combined.length < MAX_IMAGES
        ) {
          combined.push(file);
        }
      });

      return combined;
    });

    if (
      imageFiles.length + selectedFiles.length >
      MAX_IMAGES
    ) {
      setMessage(
        `áƒ”áƒ áƒ— áƒ¢áƒ£áƒ áƒ–áƒ” áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒ£áƒ› ${MAX_IMAGES} áƒ¤áƒáƒ¢áƒáƒ¡ áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ•áƒ áƒ¨áƒ”áƒ’áƒ˜áƒ«áƒšáƒ˜áƒ.`
      );
      setMessageType("error");
    }

    event.target.value = "";
  }

  function removeSelectedImage(index: number) {
    setImageFiles((currentFiles) =>
      currentFiles.filter(
        (_, fileIndex) => fileIndex !== index
      )
    );

    setMessage("");
  }

  async function uploadImages() {
    if (imageFiles.length === 0) {
      return {
        publicUrls: [] as string[],
        filePaths: [] as string[],
      };
    }

    if (!userId) {
      throw new Error("áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒ”áƒšáƒ˜ áƒ•áƒ”áƒ  áƒ›áƒáƒ˜áƒ«áƒ”áƒ‘áƒœáƒ.");
    }

    const publicUrls: string[] = [];
    const filePaths: string[] = [];

    try {
      for (
        let index = 0;
        index < imageFiles.length;
        index++
      ) {
        const imageFile = imageFiles[index];

        const extension =
          getFileExtension(imageFile);
        const randomPart =
          crypto.randomUUID();

        const fileName =
          `tour-${Date.now()}-${index}-${randomPart}.${extension}`;

        const filePath =
          `${userId}/${fileName}`;

        const { error: uploadError } =
          await supabase.storage
            .from("tour-images")
            .upload(filePath, imageFile, {
              cacheControl: "3600",
              upsert: false,
              contentType: imageFile.type,
            });

        if (uploadError) {
          throw new Error(
            `áƒ¤áƒáƒ¢áƒáƒ¡ áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ•áƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ: ${uploadError.message}`
          );
        }

        const { data: publicUrlData } =
          supabase.storage
            .from("tour-images")
            .getPublicUrl(filePath);

        filePaths.push(filePath);
        publicUrls.push(
          publicUrlData.publicUrl
        );
      }

      return {
        publicUrls,
        filePaths,
      };
    } catch (error) {
      if (filePaths.length > 0) {
        await supabase.storage
          .from("tour-images")
          .remove(filePaths);
      }

      throw error;
    }
  }

  async function addTour(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    if (!userId) {
      setMessage("áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒ”áƒšáƒ˜ áƒ•áƒ”áƒ  áƒ›áƒáƒ˜áƒ«áƒ”áƒ‘áƒœáƒ.");
      setMessageType("error");
      return;
    }

    if (!title.trim()) {
      setMessage("áƒ©áƒáƒ¬áƒ”áƒ áƒ” áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ¡áƒáƒ®áƒ”áƒšáƒ˜.");
      setMessageType("error");
      return;
    }

    if (!description.trim()) {
      setMessage("áƒ©áƒáƒ¬áƒ”áƒ áƒ” áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒáƒ¦áƒ¬áƒ”áƒ áƒ.");
      setMessageType("error");
      return;
    }

    if (!location.trim()) {
      setMessage("áƒ©áƒáƒ¬áƒ”áƒ áƒ” áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ›áƒ“áƒ”áƒ‘áƒáƒ áƒ”áƒáƒ‘áƒ.");
      setMessageType("error");
      return;
    }

    const isNegotiable =
      priceOption === "negotiable";

    const numericPrice = isNegotiable
      ? null
      : Number(price);

    if (
      !isNegotiable &&
      (!price ||
        numericPrice === null ||
        Number.isNaN(numericPrice) ||
        numericPrice < 0)
    ) {
      setMessage("áƒ©áƒáƒ¬áƒ”áƒ áƒ” áƒ¡áƒ¬áƒáƒ áƒ˜ áƒ¤áƒáƒ¡áƒ˜.");
      setMessageType("error");
      return;
    }

    if (maxPeople) {
      const numericMaxPeople = Number(maxPeople);

      if (
        !Number.isInteger(numericMaxPeople) ||
        numericMaxPeople < 1
      ) {
        setMessage(
          "áƒáƒ“áƒáƒ›áƒ˜áƒáƒœáƒ”áƒ‘áƒ˜áƒ¡ áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒáƒšáƒ£áƒ áƒ˜ áƒ áƒáƒáƒ“áƒ”áƒœáƒáƒ‘áƒ áƒ£áƒœáƒ“áƒ áƒ˜áƒ§áƒáƒ¡ áƒ›áƒ˜áƒœáƒ˜áƒ›áƒ£áƒ› 1."
        );
        setMessageType("error");
        return;
      }
    }

    if (startDate && startDate < getLocalToday()) {
      setMessage("áƒ’áƒáƒ¡áƒ£áƒšáƒ˜ áƒ—áƒáƒ áƒ˜áƒ¦áƒ˜áƒ¡ áƒáƒ áƒ©áƒ”áƒ•áƒ áƒ¨áƒ”áƒ£áƒ«áƒšáƒ”áƒ‘áƒ”áƒšáƒ˜áƒ.");
      setMessageType("error");
      return;
    }

    if (!contactPhone.trim()) {
      setMessage(
        "áƒ©áƒáƒ¬áƒ”áƒ áƒ” áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒáƒ áƒ’áƒáƒœáƒ˜áƒ–áƒáƒ¢áƒáƒ áƒ˜áƒ¡ áƒ¢áƒ”áƒšáƒ”áƒ¤áƒáƒœáƒ˜áƒ¡ áƒœáƒáƒ›áƒ”áƒ áƒ˜."
      );
      setMessageType("error");
      return;
    }

    if (!isValidPhone(contactPhone)) {
      setMessage(
        "áƒ¢áƒ”áƒšáƒ”áƒ¤áƒáƒœáƒ˜áƒ¡ áƒœáƒáƒ›áƒ”áƒ áƒ˜ áƒ©áƒáƒ¬áƒ”áƒ áƒ” áƒ¡áƒáƒ”áƒ áƒ—áƒáƒ¨áƒáƒ áƒ˜áƒ¡áƒ áƒ¤áƒáƒ áƒ›áƒáƒ¢áƒ¨áƒ˜, áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: +995555123456"
      );
      setMessageType("error");
      return;
    }

    if (isHorseRiding) {
      const minAge = horseMinAge
        ? Number(horseMinAge)
        : null;
      const maxAge = horseMaxAge
        ? Number(horseMaxAge)
        : null;
      const durationHours = horseDurationHours
        ? Number(horseDurationHours)
        : null;
      const routeKm = horseRouteKm
        ? Number(horseRouteKm)
        : null;
      const maxWeightKg = horseMaxWeightKg
        ? Number(horseMaxWeightKg)
        : null;

      if (
        minAge !== null &&
        maxAge !== null &&
        minAge > maxAge
      ) {
        setMessage(
          "áƒ¡áƒáƒªáƒ®áƒ”áƒœáƒáƒ¡áƒœáƒ áƒ¢áƒ£áƒ áƒ–áƒ” áƒ›áƒ˜áƒœáƒ˜áƒ›áƒáƒšáƒ£áƒ áƒ˜ áƒáƒ¡áƒáƒ™áƒ˜ áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒáƒšáƒ£áƒ  áƒáƒ¡áƒáƒ™áƒ–áƒ” áƒ›áƒ”áƒ¢áƒ˜ áƒ•áƒ”áƒ  áƒ˜áƒ¥áƒœáƒ”áƒ‘áƒ."
        );
        setMessageType("error");
        return;
      }

      if (
        durationHours !== null &&
        durationHours <= 0
      ) {
        setMessage(
          "áƒªáƒ®áƒ”áƒœáƒ˜áƒ— áƒ’áƒáƒ¡áƒ”áƒ˜áƒ áƒœáƒ”áƒ‘áƒ˜áƒ¡ áƒ®áƒáƒœáƒ’áƒ áƒ«áƒšáƒ˜áƒ•áƒáƒ‘áƒ áƒ£áƒœáƒ“áƒ áƒ˜áƒ§áƒáƒ¡ 0-áƒ–áƒ” áƒ›áƒ”áƒ¢áƒ˜."
        );
        setMessageType("error");
        return;
      }

      if (routeKm !== null && routeKm <= 0) {
        setMessage(
          "áƒ¡áƒáƒªáƒ®áƒ”áƒœáƒáƒ¡áƒœáƒ áƒ›áƒáƒ áƒ¨áƒ áƒ£áƒ¢áƒ˜áƒ¡ áƒ¡áƒ˜áƒ’áƒ áƒ«áƒ” áƒ£áƒœáƒ“áƒ áƒ˜áƒ§áƒáƒ¡ 0-áƒ–áƒ” áƒ›áƒ”áƒ¢áƒ˜."
        );
        setMessageType("error");
        return;
      }

      if (
        maxWeightKg !== null &&
        maxWeightKg <= 0
      ) {
        setMessage(
          "áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒáƒšáƒ£áƒ áƒ˜ áƒ¬áƒáƒœáƒ áƒ£áƒœáƒ“áƒ áƒ˜áƒ§áƒáƒ¡ 0-áƒ–áƒ” áƒ›áƒ”áƒ¢áƒ˜."
        );
        setMessageType("error");
        return;
      }
    }

    if (imageFiles.length === 0) {
      setMessage(
        "áƒáƒ˜áƒ áƒ©áƒ˜áƒ” áƒ›áƒ˜áƒœáƒ˜áƒ›áƒ£áƒ› áƒ”áƒ áƒ—áƒ˜ áƒ¤áƒáƒ¢áƒ."
      );
      setMessageType("error");
      return;
    }

    setSaving(true);

    let uploadedFilePaths: string[] = [];

    try {
      const uploadedImages =
        await uploadImages();

      uploadedFilePaths =
        uploadedImages.filePaths;

      const firstImage =
        uploadedImages.publicUrls[0] ??
        null;

      const { error: insertError } = await supabase
        .from("tours")
        .insert({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          price: numericPrice,
          price_type: isNegotiable ? "negotiable" : "fixed",
          price_currency: isNegotiable ? null : priceOption,
          duration: duration.trim() || null,
          start_date: startDate || null,
          max_people: maxPeople
            ? Number(maxPeople)
            : null,
          category: category || null,
          cancellation_policy: cancellationPolicy,
          cancellation_fee_percent: cancellationFeePercent,

          horse_experience_level: isHorseRiding
            ? horseExperienceLevel || null
            : null,
          horse_difficulty: isHorseRiding
            ? horseDifficulty || null
            : null,
          horse_min_age:
            isHorseRiding && horseMinAge
              ? Number(horseMinAge)
              : null,
          horse_max_age:
            isHorseRiding && horseMaxAge
              ? Number(horseMaxAge)
              : null,
          horse_duration_hours:
            isHorseRiding && horseDurationHours
              ? Number(horseDurationHours)
              : null,
          horse_route_km:
            isHorseRiding && horseRouteKm
              ? Number(horseRouteKm)
              : null,
          horse_helmet_included: isHorseRiding
            ? horseHelmetIncluded
            : false,
          horse_beginner_friendly: isHorseRiding
            ? horseBeginnerFriendly
            : false,
          horse_guide_included: isHorseRiding
            ? horseGuideIncluded
            : false,
          horse_choice_available: isHorseRiding
            ? horseChoiceAvailable
            : false,
          horse_max_weight_kg:
            isHorseRiding && horseMaxWeightKg
              ? Number(horseMaxWeightKg)
              : null,
          horse_safety_info: isHorseRiding
            ? horseSafetyInfo.trim() || null
            : null,
          horse_guest_requirements: isHorseRiding
            ? horseGuestRequirements.trim() || null
            : null,

          image_url: firstImage,
          image_urls:
            uploadedImages.publicUrls,
          user_id: userId,
          status: "pending",
          contact_phone: normalizePhone(contactPhone),
          has_whatsapp: hasWhatsapp,
          has_viber: hasViber,
        });

      if (insertError) {
        if (uploadedFilePaths.length > 0) {
          await supabase.storage
            .from("tour-images")
            .remove(uploadedFilePaths);
        }

        throw new Error(
          `áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ¨áƒ”áƒœáƒáƒ®áƒ•áƒ áƒ•áƒ”áƒ  áƒ›áƒáƒ®áƒ”áƒ áƒ®áƒ“áƒ: ${insertError.message}`
        );
      }

      setMessage(
        "áƒ¢áƒ£áƒ áƒ˜ áƒ¬áƒáƒ áƒ›áƒáƒ¢áƒ”áƒ‘áƒ˜áƒ— áƒ“áƒáƒ”áƒ›áƒáƒ¢áƒ áƒ“áƒ áƒ”áƒšáƒáƒ“áƒ”áƒ‘áƒ áƒáƒ“áƒ›áƒ˜áƒœáƒ˜áƒ¡áƒ¢áƒ áƒáƒ¢áƒáƒ áƒ˜áƒ¡ áƒ“áƒáƒ“áƒáƒ¡áƒ¢áƒ£áƒ áƒ”áƒ‘áƒáƒ¡."
      );
      setMessageType("success");

      router.push("/dashboard/my-tours");
      router.refresh();
    } catch (error) {
      console.error("Add tour error:", error);

      const errorText =
        error instanceof Error
          ? error.message
          : "áƒ£áƒªáƒœáƒáƒ‘áƒ˜ áƒ¨áƒ”áƒªáƒ“áƒáƒ›áƒ áƒ›áƒáƒ®áƒ“áƒ.";

      setMessage(errorText);
      setMessageType("error");
      setSaving(false);
    }
  }

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="text-6xl">ðŸ”ï¸</div>

          <p className="mt-4 text-lg font-semibold">
            áƒ’áƒ•áƒ”áƒ áƒ“áƒ˜ áƒ˜áƒ¢áƒ•áƒ˜áƒ áƒ—áƒ”áƒ‘áƒ...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒšáƒ˜áƒ¡ áƒžáƒáƒœáƒ”áƒšáƒ˜
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              âž• áƒáƒ®áƒáƒšáƒ˜ áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-white/60">
              áƒ¨áƒ”áƒáƒ•áƒ¡áƒ” áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ˜áƒœáƒ¤áƒáƒ áƒ›áƒáƒªáƒ˜áƒ áƒ“áƒ áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ” áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒ£áƒ› 5 áƒ¤áƒáƒ¢áƒ.
              áƒ¢áƒ£áƒ áƒ˜ áƒ’áƒáƒ›áƒáƒ¥áƒ•áƒ”áƒ§áƒœáƒ“áƒ”áƒ‘áƒ áƒáƒ“áƒ›áƒ˜áƒœáƒ˜áƒ¡áƒ¢áƒ áƒáƒ¢áƒáƒ áƒ˜áƒ¡ áƒ“áƒáƒ“áƒáƒ¡áƒ¢áƒ£áƒ áƒ”áƒ‘áƒ˜áƒ¡
              áƒ¨áƒ”áƒ›áƒ“áƒ”áƒ’.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="w-fit rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/20"
          >
            â† Dashboard
          </Link>
        </header>

        {message && (
          <div
            className={`mt-7 rounded-2xl border p-5 font-semibold ${
              messageType === "success"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-400/30 bg-red-500/10 text-red-200"
            }`}
          >
            {messageType === "success" ? "âœ… " : "âŒ "}
            {message}
          </div>
        )}

        <form
          onSubmit={addTour}
          className="mt-8 space-y-8 rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8"
        >
          <section>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Tour information
            </p>

            <h2 className="mt-2 text-3xl font-black">
              áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ˜áƒœáƒ¤áƒáƒ áƒ›áƒáƒªáƒ˜áƒ
            </h2>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
                            <FormField label="გაუქმების პოლიტიკა" required>
                <select
                  value={cancellationPolicy}
                  onChange={(event) =>
                    setCancellationPolicy(
                      event.target.value as
                        | "24_hours"
                        | "3_days"
                        | "7_days"
                        | "14_days"
                    )
                  }
                  className="input"
                  required
                >
                  <option value="24_hours">
                    24 საათი — ვადის შემდეგ 100% ჯარიმა
                  </option>

                  <option value="3_days">
                    3 დღე — ვადის შემდეგ 50% ჯარიმა
                  </option>

                  <option value="7_days">
                    7 დღე — ვადის შემდეგ 30% ჯარიმა
                  </option>

                  <option value="14_days">
                    14 დღე — ვადის შემდეგ 20% ჯარიმა
                  </option>
                </select>

                <p className="mt-2 text-sm text-slate-500">
                  უფასო გაუქმება შესაძლებელია არჩეულ ვადამდე.
                  ვადის გასვლის შემდეგ მოქმედებს {cancellationFeePercent}% ჯარიმა.
                </p>
              </FormField>
<FormField
                label="áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ¡áƒáƒ®áƒ”áƒšáƒ˜"
                required
              >
                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: áƒ£áƒ¨áƒ’áƒ£áƒšáƒ˜áƒ¡ áƒ”áƒ áƒ—áƒ“áƒ¦áƒ˜áƒáƒœáƒ˜ áƒ¢áƒ£áƒ áƒ˜"
                  required
                  className="input"
                />
              </FormField>

              <FormField
                label="áƒ›áƒ“áƒ”áƒ‘áƒáƒ áƒ”áƒáƒ‘áƒ"
                required
              >
                <input
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: áƒ£áƒ¨áƒ’áƒ£áƒšáƒ˜, áƒ¡áƒ•áƒáƒœáƒ”áƒ—áƒ˜"
                  required
                  className="input"
                />
              </FormField>

              <FormField
                label="áƒ¤áƒáƒ¡áƒ˜áƒ¡ áƒ¢áƒ˜áƒžáƒ˜"
                required
              >
                <select
                  value={priceOption}
                  onChange={(event) => {
                    const value = event.target.value as
                      | "negotiable"
                      | "GEL"
                      | "USD";

                    setPriceOption(value);

                    if (value === "negotiable") {
                      setPrice("");
                    }
                  }}
                  className="input"
                >
                  <option value="negotiable">
                    ðŸ¤ áƒ¤áƒáƒ¡áƒ˜ áƒ¨áƒ”áƒ—áƒáƒœáƒ®áƒ›áƒ”áƒ‘áƒ˜áƒ—
                  </option>
                  <option value="GEL">
                    â‚¾ áƒ¤áƒáƒ¡áƒ˜ áƒšáƒáƒ áƒ¨áƒ˜
                  </option>
                  <option value="USD">
                    $ áƒ¤áƒáƒ¡áƒ˜ áƒ“áƒáƒšáƒáƒ áƒ¨áƒ˜
                  </option>
                </select>
              </FormField>

              {priceOption !== "negotiable" ? (
                <FormField
                  label={
                    priceOption === "USD"
                      ? "áƒ¤áƒáƒ¡áƒ˜ áƒ“áƒáƒšáƒáƒ áƒ¨áƒ˜ ($)"
                      : "áƒ¤áƒáƒ¡áƒ˜ áƒšáƒáƒ áƒ¨áƒ˜ (â‚¾)"
                  }
                  required
                >
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(event) =>
                        setPrice(event.target.value)
                      }
                      placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: 150"
                      required
                      className="input pr-14"
                    />

                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                      {priceOption === "USD" ? "$" : "â‚¾"}
                    </span>
                  </div>
                </FormField>
              ) : (
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm font-semibold leading-6 text-cyan-800">
                  ðŸ¤ áƒ¡áƒáƒ˜áƒ¢áƒ–áƒ” áƒ’áƒáƒ›áƒáƒ©áƒœáƒ“áƒ”áƒ‘áƒ: <strong>áƒ¤áƒáƒ¡áƒ˜ áƒ¨áƒ”áƒ—áƒáƒœáƒ®áƒ›áƒ”áƒ‘áƒ˜áƒ—</strong>
                </div>
              )}

              <FormField label="áƒ®áƒáƒœáƒ’áƒ áƒ«áƒšáƒ˜áƒ•áƒáƒ‘áƒ">
                <input
                  type="text"
                  value={duration}
                  onChange={(event) =>
                    setDuration(event.target.value)
                  }
                  placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: 1 áƒ“áƒ¦áƒ”"
                  className="input"
                />
              </FormField>

              <FormField label="áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ“áƒáƒ¬áƒ§áƒ”áƒ‘áƒ˜áƒ¡ áƒ—áƒáƒ áƒ˜áƒ¦áƒ˜">
                <input
                  type="date"
                  value={startDate}
                  min={getLocalToday()}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                  className="input"
                />
              </FormField>

              <FormField label="áƒáƒ“áƒáƒ›áƒ˜áƒáƒœáƒ”áƒ‘áƒ˜áƒ¡ áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒáƒšáƒ£áƒ áƒ˜ áƒ áƒáƒáƒ“áƒ”áƒœáƒáƒ‘áƒ">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxPeople}
                  onChange={(event) =>
                    setMaxPeople(event.target.value)
                  }
                  placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: 12"
                  className="input"
                />
              </FormField>

              <FormField label="áƒ™áƒáƒ¢áƒ”áƒ’áƒáƒ áƒ˜áƒ">
                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="input"
                >
                  <option value="">
                    áƒáƒ˜áƒ áƒ©áƒ˜áƒ” áƒ™áƒáƒ¢áƒ”áƒ’áƒáƒ áƒ˜áƒ
                  </option>

                  <option value="Hiking">
                    ðŸ¥¾ áƒšáƒáƒ¨áƒ¥áƒ áƒáƒ‘áƒ
                  </option>

                  <option value="Jeep Tour">
                    ðŸš™ áƒ¯áƒ˜áƒž áƒ¢áƒ£áƒ áƒ˜
                  </option>

                  <option value="Horse Riding">
                    ðŸŽ áƒªáƒ®áƒ”áƒœáƒ˜áƒ— áƒ’áƒáƒ¡áƒ”áƒ˜áƒ áƒœáƒ”áƒ‘áƒ
                  </option>

                  <option value="Cultural Tour">
                    ðŸ›ï¸ áƒ™áƒ£áƒšáƒ¢áƒ£áƒ áƒ£áƒšáƒ˜ áƒ¢áƒ£áƒ áƒ˜
                  </option>

                  <option value="Adventure">
                    ðŸ§— áƒ¡áƒáƒ—áƒáƒ•áƒ’áƒáƒ“áƒáƒ¡áƒáƒ•áƒšáƒ áƒ¢áƒ£áƒ áƒ˜
                  </option>

                  <option value="Sightseeing">
                    ðŸ“¸ áƒ¦áƒ˜áƒ áƒ¡áƒ¨áƒ”áƒ¡áƒáƒœáƒ˜áƒ¨áƒœáƒáƒáƒ‘áƒ”áƒ‘áƒ˜
                  </option>

                  <option value="Winter Tour">
                    â„ï¸ áƒ–áƒáƒ›áƒ—áƒ áƒ˜áƒ¡ áƒ¢áƒ£áƒ áƒ˜
                  </option>
                </select>
              </FormField>
            </div>

            {isHorseRiding && (
              <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50/70 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">ðŸŽ</div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700">
                      Horse Riding Details
                    </p>

                    <h3 className="mt-1 text-2xl font-black text-slate-900">
                      áƒ¡áƒáƒªáƒ®áƒ”áƒœáƒáƒ¡áƒœáƒ áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ“áƒ”áƒ¢áƒáƒšáƒ”áƒ‘áƒ˜
                    </h3>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      áƒ”áƒ¡ áƒ˜áƒœáƒ¤áƒáƒ áƒ›áƒáƒªáƒ˜áƒ áƒ’áƒáƒ›áƒáƒ©áƒœáƒ“áƒ”áƒ‘áƒ áƒ›áƒ®áƒáƒšáƒáƒ“ Horse Riding áƒ™áƒáƒ¢áƒ”áƒ’áƒáƒ áƒ˜áƒ˜áƒ¡ áƒ¢áƒ£áƒ áƒ”áƒ‘áƒ–áƒ”.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <FormField label="áƒ’áƒáƒ›áƒáƒªáƒ“áƒ˜áƒšáƒ”áƒ‘áƒ˜áƒ¡ áƒ“áƒáƒœáƒ”">
                    <select
                      value={horseExperienceLevel}
                      onChange={(event) =>
                        setHorseExperienceLevel(
                          event.target.value
                        )
                      }
                      className="input"
                    >
                      <option value="">
                        áƒáƒ˜áƒ áƒ©áƒ˜áƒ” áƒ“áƒáƒœáƒ”
                      </option>
                      <option value="Any">
                        áƒ§áƒ•áƒ”áƒšáƒáƒ¡áƒ—áƒ•áƒ˜áƒ¡ / Any
                      </option>
                      <option value="Beginner">
                        áƒ“áƒáƒ›áƒ¬áƒ§áƒ”áƒ‘áƒ˜ / Beginner
                      </option>
                      <option value="Intermediate">
                        áƒ¡áƒáƒ¨áƒ£áƒáƒšáƒ / Intermediate
                      </option>
                      <option value="Experienced">
                        áƒ’áƒáƒ›áƒáƒªáƒ“áƒ˜áƒšáƒ˜ / Experienced
                      </option>
                    </select>
                  </FormField>

                  <FormField label="áƒ›áƒáƒ áƒ¨áƒ áƒ£áƒ¢áƒ˜áƒ¡ áƒ¡áƒ˜áƒ áƒ—áƒ£áƒšáƒ”">
                    <select
                      value={horseDifficulty}
                      onChange={(event) =>
                        setHorseDifficulty(
                          event.target.value
                        )
                      }
                      className="input"
                    >
                      <option value="">
                        áƒáƒ˜áƒ áƒ©áƒ˜áƒ” áƒ¡áƒ˜áƒ áƒ—áƒ£áƒšáƒ”
                      </option>
                      <option value="Easy">
                        áƒ›áƒáƒ áƒ¢áƒ˜áƒ•áƒ˜ / Easy
                      </option>
                      <option value="Moderate">
                        áƒ¡áƒáƒ¨áƒ£áƒáƒšáƒ / Moderate
                      </option>
                      <option value="Difficult">
                        áƒ áƒ—áƒ£áƒšáƒ˜ / Difficult
                      </option>
                    </select>
                  </FormField>

                  <FormField label="áƒ›áƒ˜áƒœáƒ˜áƒ›áƒáƒšáƒ£áƒ áƒ˜ áƒáƒ¡áƒáƒ™áƒ˜">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={horseMinAge}
                      onChange={(event) =>
                        setHorseMinAge(
                          event.target.value
                        )
                      }
                      placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: 8"
                      className="input"
                    />
                  </FormField>

                  <FormField label="áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒáƒšáƒ£áƒ áƒ˜ áƒáƒ¡áƒáƒ™áƒ˜">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={horseMaxAge}
                      onChange={(event) =>
                        setHorseMaxAge(
                          event.target.value
                        )
                      }
                      placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: 65"
                      className="input"
                    />
                  </FormField>

                  <FormField label="áƒ®áƒáƒœáƒ’áƒ áƒ«áƒšáƒ˜áƒ•áƒáƒ‘áƒ áƒ¡áƒáƒáƒ—áƒ”áƒ‘áƒ¨áƒ˜">
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={horseDurationHours}
                      onChange={(event) =>
                        setHorseDurationHours(
                          event.target.value
                        )
                      }
                      placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: 2.5"
                      className="input"
                    />
                  </FormField>

                  <FormField label="áƒ›áƒáƒ áƒ¨áƒ áƒ£áƒ¢áƒ˜áƒ¡ áƒ¡áƒ˜áƒ’áƒ áƒ«áƒ” (áƒ™áƒ›)">
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={horseRouteKm}
                      onChange={(event) =>
                        setHorseRouteKm(
                          event.target.value
                        )
                      }
                      placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: 8"
                      className="input"
                    />
                  </FormField>

                  <FormField label="áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒáƒšáƒ£áƒ áƒ˜ áƒ¬áƒáƒœáƒ (áƒ™áƒ’)">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={horseMaxWeightKg}
                      onChange={(event) =>
                        setHorseMaxWeightKg(
                          event.target.value
                        )
                      }
                      placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: 100"
                      className="input"
                    />
                  </FormField>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                      horseHelmetIncluded
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={horseHelmetIncluded}
                      onChange={(event) =>
                        setHorseHelmetIncluded(
                          event.target.checked
                        )
                      }
                      className="h-5 w-5 accent-emerald-600"
                    />

                    <div>
                      <p className="font-black text-slate-900">
                        ðŸª– áƒ©áƒáƒ¤áƒ®áƒ£áƒ¢áƒ˜ áƒ¨áƒ”áƒ“áƒ˜áƒ¡
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        áƒ¡áƒ¢áƒ£áƒ›áƒ áƒ˜áƒ¡áƒ—áƒ•áƒ˜áƒ¡ áƒ©áƒáƒ¤áƒ®áƒ£áƒ¢áƒ˜ áƒ®áƒ”áƒšáƒ›áƒ˜áƒ¡áƒáƒ¬áƒ•áƒ“áƒáƒ›áƒ˜áƒ
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                      horseBeginnerFriendly
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={horseBeginnerFriendly}
                      onChange={(event) =>
                        setHorseBeginnerFriendly(
                          event.target.checked
                        )
                      }
                      className="h-5 w-5 accent-emerald-600"
                    />

                    <div>
                      <p className="font-black text-slate-900">
                        ðŸŒ± áƒ“áƒáƒ›áƒ¬áƒ§áƒ”áƒ‘áƒ˜áƒ¡áƒ—áƒ•áƒ˜áƒ¡ áƒ¨áƒ”áƒ¡áƒáƒ¤áƒ”áƒ áƒ˜áƒ¡áƒ˜áƒ
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        áƒ¬áƒ˜áƒœáƒáƒ¡áƒ¬áƒáƒ áƒ˜ áƒ’áƒáƒ›áƒáƒªáƒ“áƒ˜áƒšáƒ”áƒ‘áƒ áƒáƒ£áƒªáƒ˜áƒšáƒ”áƒ‘áƒ”áƒšáƒ˜ áƒáƒ  áƒáƒ áƒ˜áƒ¡
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                      horseGuideIncluded
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={horseGuideIncluded}
                      onChange={(event) =>
                        setHorseGuideIncluded(
                          event.target.checked
                        )
                      }
                      className="h-5 w-5 accent-emerald-600"
                    />

                    <div>
                      <p className="font-black text-slate-900">
                        ðŸ§‘â€ðŸŒ¾ áƒ’áƒ˜áƒ“áƒ˜ áƒ›áƒáƒ§áƒ•áƒ”áƒ‘áƒ
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        áƒ¢áƒ£áƒ áƒ¡ áƒ—áƒáƒœ áƒáƒ®áƒšáƒáƒ•áƒ¡ áƒáƒ“áƒ’áƒ˜áƒšáƒáƒ‘áƒ áƒ˜áƒ•áƒ˜ áƒ’áƒ˜áƒ“áƒ˜
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                      horseChoiceAvailable
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={horseChoiceAvailable}
                      onChange={(event) =>
                        setHorseChoiceAvailable(
                          event.target.checked
                        )
                      }
                      className="h-5 w-5 accent-emerald-600"
                    />

                    <div>
                      <p className="font-black text-slate-900">
                        ðŸ´ áƒªáƒ®áƒ”áƒœáƒ˜áƒ¡ áƒáƒ áƒ©áƒ”áƒ•áƒ áƒ¨áƒ”áƒ¡áƒáƒ«áƒšáƒ”áƒ‘áƒ”áƒšáƒ˜áƒ
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        áƒ¡áƒ¢áƒ£áƒ›áƒáƒ áƒ¡ áƒ¨áƒ”áƒ£áƒ«áƒšáƒ˜áƒ áƒ®áƒ”áƒšáƒ›áƒ˜áƒ¡áƒáƒ¬áƒ•áƒ“áƒáƒ›áƒ˜ áƒªáƒ®áƒ”áƒœáƒ”áƒ‘áƒ˜áƒ“áƒáƒœ áƒáƒ áƒ©áƒ”áƒ•áƒ
                      </p>
                    </div>
                  </label>
                </div>

                <div className="mt-6 grid gap-5">
                  <FormField label="áƒ£áƒ¡áƒáƒ¤áƒ áƒ—áƒ®áƒáƒ”áƒ‘áƒ˜áƒ¡ áƒ˜áƒœáƒ¡áƒ¢áƒ áƒ£áƒ¥áƒªáƒ˜áƒ">
                    <textarea
                      value={horseSafetyInfo}
                      onChange={(event) =>
                        setHorseSafetyInfo(
                          event.target.value
                        )
                      }
                      placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ“áƒáƒ¬áƒ§áƒ”áƒ‘áƒáƒ›áƒ“áƒ” áƒ¢áƒáƒ áƒ“áƒ”áƒ‘áƒ áƒ›áƒáƒ™áƒšáƒ” áƒ˜áƒœáƒ¡áƒ¢áƒ áƒ£áƒ¥áƒ¢áƒáƒŸáƒ˜..."
                      rows={4}
                      className="input resize-none"
                    />
                  </FormField>

                  <FormField label="áƒ áƒ áƒ£áƒœáƒ“áƒ áƒ˜áƒ¥áƒáƒœáƒ˜áƒáƒ¡ áƒ¡áƒ¢áƒ£áƒ›áƒáƒ áƒ›áƒ / áƒ¡áƒžáƒ”áƒªáƒ˜áƒáƒšáƒ£áƒ áƒ˜ áƒžáƒ˜áƒ áƒáƒ‘áƒ”áƒ‘áƒ˜">
                    <textarea
                      value={horseGuestRequirements}
                      onChange={(event) =>
                        setHorseGuestRequirements(
                          event.target.value
                        )
                      }
                      placeholder="áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“: áƒ“áƒáƒ®áƒ£áƒ áƒ£áƒšáƒ˜ áƒ¤áƒ”áƒ®áƒ¡áƒáƒªáƒ›áƒ”áƒšáƒ˜, áƒ’áƒ áƒ«áƒ”áƒšáƒ˜ áƒ¨áƒáƒ áƒ•áƒáƒšáƒ˜, áƒ¬áƒ§áƒáƒšáƒ˜..."
                      rows={4}
                      className="input resize-none"
                    />
                  </FormField>
                </div>
              </div>
            )}

            <div className="mt-5">
              <FormField
                label="áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ¡áƒ áƒ£áƒšáƒ˜ áƒáƒ¦áƒ¬áƒ”áƒ áƒ"
                required
              >
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="áƒáƒ¦áƒ¬áƒ”áƒ áƒ” áƒ›áƒáƒ áƒ¨áƒ áƒ£áƒ¢áƒ˜, áƒ›áƒáƒ›áƒ¡áƒáƒ®áƒ£áƒ áƒ”áƒ‘áƒ, áƒ¨áƒ”áƒ®áƒ•áƒ”áƒ“áƒ áƒ˜áƒ¡ áƒáƒ“áƒ’áƒ˜áƒšáƒ˜ áƒ“áƒ áƒ›áƒœáƒ˜áƒ¨áƒ•áƒœáƒ”áƒšáƒáƒ•áƒáƒœáƒ˜ áƒžáƒ˜áƒ áƒáƒ‘áƒ”áƒ‘áƒ˜..."
                  rows={7}
                  required
                  className="input resize-none"
                />
              </FormField>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Contact information
            </p>

            <h2 className="mt-2 text-3xl font-black">
              áƒ¡áƒáƒ™áƒáƒœáƒ¢áƒáƒ¥áƒ¢áƒ áƒ˜áƒœáƒ¤áƒáƒ áƒ›áƒáƒªáƒ˜áƒ
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              áƒ©áƒáƒ¬áƒ”áƒ áƒ” áƒ¡áƒáƒ”áƒ áƒ—áƒáƒ¨áƒáƒ áƒ˜áƒ¡áƒ áƒ¤áƒáƒ áƒ›áƒáƒ¢áƒ˜áƒ¡ áƒœáƒáƒ›áƒ”áƒ áƒ˜. áƒ£áƒªáƒ®áƒáƒ”áƒšáƒ˜
              áƒ¢áƒ£áƒ áƒ˜áƒ¡áƒ¢áƒ˜ áƒáƒ› áƒœáƒáƒ›áƒ áƒ˜áƒ— áƒ¨áƒ”áƒ«áƒšáƒ”áƒ‘áƒ¡ WhatsApp-áƒ–áƒ” áƒáƒœ Viber-áƒ–áƒ”
              áƒ“áƒáƒ™áƒáƒ•áƒ¨áƒ˜áƒ áƒ”áƒ‘áƒáƒ¡.
            </p>

            <div className="mt-7">
              <FormField
                label="áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒáƒ áƒ’áƒáƒœáƒ˜áƒ–áƒáƒ¢áƒáƒ áƒ˜áƒ¡ áƒ¢áƒ”áƒšáƒ”áƒ¤áƒáƒœáƒ˜áƒ¡ áƒœáƒáƒ›áƒ”áƒ áƒ˜"
                required
              >
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(event) =>
                    setContactPhone(event.target.value)
                  }
                  placeholder="+995555123456"
                  required
                  className="input"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  áƒ’áƒáƒ›áƒáƒ˜áƒ§áƒ”áƒœáƒ” áƒ¥áƒ•áƒ”áƒ§áƒœáƒ˜áƒ¡ áƒ™áƒáƒ“áƒ˜, áƒ›áƒáƒ’áƒáƒšáƒ˜áƒ—áƒáƒ“:
                  +995555123456
                </p>
              </FormField>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                  hasWhatsapp
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 bg-slate-50 hover:border-emerald-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasWhatsapp}
                  onChange={(event) =>
                    setHasWhatsapp(event.target.checked)
                  }
                  className="h-5 w-5 accent-emerald-600"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl text-white">
                  â˜Ž
                </div>

                <div>
                  <p className="font-black text-slate-900">
                    WhatsApp
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    áƒáƒ› áƒœáƒáƒ›áƒ”áƒ áƒ–áƒ” WhatsApp áƒ®áƒ”áƒšáƒ›áƒ˜áƒ¡áƒáƒ¬áƒ•áƒ“áƒáƒ›áƒ˜áƒ
                  </p>
                </div>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-5 transition ${
                  hasViber
                    ? "border-violet-500 bg-violet-50"
                    : "border-slate-200 bg-slate-50 hover:border-violet-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={hasViber}
                  onChange={(event) =>
                    setHasViber(event.target.checked)
                  }
                  className="h-5 w-5 accent-violet-600"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-2xl text-white">
                  ðŸ“ž
                </div>

                <div>
                  <p className="font-black text-slate-900">
                    Viber
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    áƒáƒ› áƒœáƒáƒ›áƒ”áƒ áƒ–áƒ” Viber áƒ®áƒ”áƒšáƒ›áƒ˜áƒ¡áƒáƒ¬áƒ•áƒ“áƒáƒ›áƒ˜áƒ
                  </p>
                </div>
              </label>
            </div>

            {!hasWhatsapp && !hasViber && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-800">
                â„¹ï¸ WhatsApp áƒáƒœ Viber áƒ›áƒáƒœáƒ˜áƒ¨áƒœáƒ£áƒšáƒ˜ áƒáƒ  áƒáƒ áƒ˜áƒ¡.
                áƒ›áƒáƒ›áƒ®áƒ›áƒáƒ áƒ”áƒ‘áƒ”áƒšáƒ˜ áƒ›áƒ®áƒáƒšáƒáƒ“ áƒ©áƒ•áƒ”áƒ£áƒšáƒ”áƒ‘áƒ áƒ˜áƒ•áƒ˜ áƒ–áƒáƒ áƒ˜áƒ— áƒ¨áƒ”áƒ«áƒšáƒ”áƒ‘áƒ¡
                áƒ“áƒáƒ™áƒáƒ•áƒ¨áƒ˜áƒ áƒ”áƒ‘áƒáƒ¡.
              </div>
            )}
          </section>

          <section className="border-t border-slate-200 pt-8">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-600">
              Tour gallery
            </p>

            <h2 className="mt-2 text-3xl font-black">
              ðŸ“¸ áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ¤áƒáƒ¢áƒáƒ”áƒ‘áƒ˜
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              áƒ¨áƒ”áƒ’áƒ˜áƒ«áƒšáƒ˜áƒ áƒáƒ¢áƒ•áƒ˜áƒ áƒ—áƒ áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒ£áƒ› 5 áƒ¤áƒáƒ¢áƒ.
              áƒžáƒ˜áƒ áƒ•áƒ”áƒšáƒ˜ áƒ¤áƒáƒ¢áƒ áƒ˜áƒ¥áƒœáƒ”áƒ‘áƒ áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ›áƒ—áƒáƒ•áƒáƒ áƒ˜ áƒ¤áƒáƒ¢áƒ.
              áƒ—áƒ˜áƒ—áƒáƒ”áƒ£áƒšáƒ˜ áƒ¤áƒáƒ¢áƒáƒ¡ áƒ›áƒáƒ¥áƒ¡áƒ˜áƒ›áƒáƒšáƒ£áƒ áƒ˜ áƒ–áƒáƒ›áƒáƒ 10 MB.
            </p>

            <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-black text-slate-900">
                    ðŸ“· áƒ“áƒáƒáƒ›áƒáƒ¢áƒ” áƒ¤áƒáƒ¢áƒ
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    áƒáƒ áƒ©áƒ”áƒ£áƒšáƒ˜áƒ {imageFiles.length} / {MAX_IMAGES} áƒ¤áƒáƒ¢áƒ
                  </p>
                </div>

                <label
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 font-black text-white shadow-lg transition sm:w-auto ${
                    saving ||
                    imageFiles.length >= MAX_IMAGES
                      ? "cursor-not-allowed bg-slate-400"
                      : "cursor-pointer bg-cyan-600 hover:bg-cyan-700"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleImageChange}
                    disabled={
                      saving ||
                      imageFiles.length >= MAX_IMAGES
                    }
                    className="hidden"
                  />

                  {imageFiles.length === 0
                    ? "âž• áƒ¤áƒáƒ¢áƒáƒ¡ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ"
                    : imageFiles.length >= MAX_IMAGES
                      ? "âœ… 5 áƒ¤áƒáƒ¢áƒ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ£áƒšáƒ˜áƒ"
                      : "âž• áƒ™áƒ˜áƒ“áƒ”áƒ• áƒ¤áƒáƒ¢áƒáƒ¡ áƒ“áƒáƒ›áƒáƒ¢áƒ”áƒ‘áƒ"}
                </label>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                áƒ¢áƒ”áƒšáƒ”áƒ¤áƒáƒœáƒ˜áƒ“áƒáƒœ áƒ¨áƒ”áƒ’áƒ˜áƒ«áƒšáƒ˜áƒ áƒ¤áƒáƒ¢áƒáƒ”áƒ‘áƒ˜ áƒ›áƒáƒœáƒ˜áƒ¨áƒœáƒ áƒ”áƒ áƒ—áƒ“áƒ áƒáƒ£áƒšáƒáƒ“
                áƒáƒœ áƒ¦áƒ˜áƒšáƒáƒ™áƒ¡ áƒ áƒáƒ›áƒ“áƒ”áƒœáƒ¯áƒ”áƒ áƒ›áƒ” áƒ“áƒáƒáƒ­áƒ˜áƒ áƒ.
              </p>
            </div>

            {previewUrls.length > 0 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {previewUrls.map(
                  (url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm"
                    >
                      <div className="relative">
                        <img
                          src={url}
                          alt={`áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ¤áƒáƒ¢áƒ ${
                            index + 1
                          }`}
                          className="h-48 w-full object-cover"
                        />

                        {index === 0 && (
                          <div className="absolute left-3 top-3 rounded-full bg-cyan-600 px-4 py-2 text-xs font-black text-white shadow-lg">
                            â­ áƒ›áƒ—áƒáƒ•áƒáƒ áƒ˜ áƒ¤áƒáƒ¢áƒ
                          </div>
                        )}

                        <div className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-2 text-xs font-black text-white">
                          {index + 1}
                        </div>
                      </div>

                      <div className="p-4">
                        <p className="truncate text-sm font-semibold text-slate-600">
                          {
                            imageFiles[index]
                              ?.name
                          }
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedImage(
                              index
                            )
                          }
                          disabled={saving}
                          className="mt-3 w-full rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-200 disabled:opacity-50"
                        >
                          ðŸ—‘ï¸ áƒ¤áƒáƒ¢áƒáƒ¡ áƒ›áƒáƒªáƒ˜áƒšáƒ”áƒ‘áƒ
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {imageFiles.length >= MAX_IMAGES && (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                âœ… 5 áƒ¤áƒáƒ¢áƒ áƒ£áƒ™áƒ•áƒ” áƒáƒ áƒ©áƒ”áƒ£áƒšáƒ˜áƒ.
              </div>
            )}
          </section>

          <div className="flex flex-col-reverse gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              disabled={saving}
              className="rounded-2xl bg-slate-200 px-7 py-4 font-bold text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              áƒ’áƒáƒ£áƒ¥áƒ›áƒ”áƒ‘áƒ
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-cyan-600 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving
                ? `áƒ¢áƒ£áƒ áƒ˜ áƒ“áƒ ${imageFiles.length} áƒ¤áƒáƒ¢áƒ áƒ˜áƒœáƒáƒ®áƒ”áƒ‘áƒ...`
                : "ðŸ”ï¸ áƒ¢áƒ£áƒ áƒ˜áƒ¡ áƒ’áƒáƒ’áƒ–áƒáƒ•áƒœáƒ"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      {children}
    </label>
  );
}

function getFileExtension(file: File) {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  if (
    extension &&
    ["jpg", "jpeg", "png", "webp"].includes(extension)
  ) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function getLocalToday() {
  const now = new Date();
  const timezoneOffset =
    now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset)
    .toISOString()
    .split("T")[0];
}

function normalizePhone(phone: string) {
  const trimmedPhone = phone.trim();
  const hasPlus = trimmedPhone.startsWith("+");

  const digits = trimmedPhone.replace(/\D/g, "");

  return hasPlus ? `+${digits}` : digits;
}

function isValidPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);

  return /^\+\d{8,15}$/.test(normalizedPhone);
}


