import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CTF_COOKIE_NAME, isValidSolvedToken } from "@/lib/challenge";
import ApplicationForm from "@/components/ApplicationForm";

export default function ApplyPage() {
  const token = cookies().get(CTF_COOKIE_NAME)?.value;

  if (!isValidSolvedToken(token)) {
    redirect("/");
  }

  return <ApplicationForm />;
}
