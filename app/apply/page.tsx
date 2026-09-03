import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SOLVED_COOKIE_NAME, isValidSolvedToken } from "@/lib/challenge";
import ApplicationForm from "@/components/ApplicationForm";

export default function ApplyPage() {
  const token = cookies().get(SOLVED_COOKIE_NAME)?.value;

  if (!isValidSolvedToken(token)) {
    redirect("/");
  }

  return <ApplicationForm />;
}
