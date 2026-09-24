"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/app/_components/TopBar";
import { Wordmark } from "@/app/_components/Wordmark";
import { useLocale, type Locale } from "@/app/_lib/i18n";

type Section = { heading: string; body: string[] };
type Copy = { title: string; meta: string; sections: Section[]; contact: (email: string) => string; updated: string };

/**
 * What WatNu is, and what it keeps about whom — the plain version, in the app's own voice. It is
 * long-form text, so it lives here rather than in the dictionaries. Keep it true: when something
 * new is stored or a service is added, this page changes with it.
 */
const COPY: Record<Locale, Copy> = {
  en: {
    title: "About WatNu",
    meta: "What this is, and what it keeps about you.",
    sections: [
      {
        heading: "What WatNu is",
        body: [
          "Everything on in Maastricht this week, in one place: events from student associations, cafés, clubs and venues. Organizers post their own events — the AI reads a poster so nobody has to type it out. Newcomers welcome.",
        ],
      },
      {
        heading: "On your phone, without an account",
        body: [
          "Students don't sign in. Saved events, followed organizers, your name, theme and language are stored in this browser only. Clearing them on the profile tab, or deleting the site's data, removes them. Nothing of this reaches our server unless you turn reminders on.",
        ],
      },
      {
        heading: "Reminders",
        body: [
          "If you turn reminders on, we store this phone's push address (an anonymous token the browser hands out, no name) together with the ids of the events you saved, so the reminder can be sent. Turning reminders off deletes it again; a push address that stops working is dropped.",
        ],
      },
      {
        heading: "Counts for organizers",
        body: ["A view of an event, a save and a follow are counted per day — as numbers, with nothing that identifies you. Organizers see them as their stats."],
      },
      {
        heading: "What you send us",
        body: [
          "A report (“Something wrong?”) stores the reason and your note. An access request stores the organization, name, email and note you enter, so we can set up the account and reply.",
        ],
      },
      {
        heading: "Organizer accounts",
        body: [
          "Organizers sign in with an email address and a password we hand out; the email is stored to run the account. Posters and logos they upload are public. Anthropic's AI reads those posters to extract the event details — the poster, nothing else.",
        ],
      },
      {
        heading: "Where it runs",
        body: [
          "Hosted on Vercel; database and images at Supabase. Fonts are served from our own domain. Vercel's analytics counts page views and a few taps (a save, a follow, reminders on, an install, a share) without cookies — a hashed identifier that changes daily, no name, no tracking across sites. One cookie remembers your language.",
        ],
      },
    ],
    contact: (email) => `Questions, or want something removed? Write to ${email}.`,
    updated: "Last updated 24 September 2026.",
  },
  nl: {
    title: "Over WatNu",
    meta: "Wat dit is, en wat het over je bewaart.",
    sections: [
      {
        heading: "Wat WatNu is",
        body: [
          "Alles wat er deze week in Maastricht te doen is, op één plek: evenementen van studentenverenigingen, cafés, clubs en locaties. Organisatoren plaatsen hun eigen evenementen — de AI leest een poster, zodat niemand hoeft over te typen. Nieuwkomers welkom.",
        ],
      },
      {
        heading: "Op je telefoon, zonder account",
        body: [
          "Studenten loggen niet in. Opgeslagen evenementen, gevolgde organisatoren, je naam, thema en taal staan alleen in deze browser. Wissen op het profieltabblad, of de sitegegevens verwijderen, haalt ze weg. Niets hiervan bereikt onze server, tenzij je herinneringen aanzet.",
        ],
      },
      {
        heading: "Herinneringen",
        body: [
          "Zet je herinneringen aan, dan bewaren we het pushadres van deze telefoon (een anoniem token dat de browser uitgeeft, geen naam) samen met de id's van de evenementen die je hebt opgeslagen, zodat de herinnering verstuurd kan worden. Herinneringen uitzetten verwijdert dat weer; een pushadres dat niet meer werkt, wordt weggegooid.",
        ],
      },
      {
        heading: "Tellingen voor organisatoren",
        body: ["Een weergave van een evenement, een opslag en een volger worden per dag geteld — als getallen, zonder iets dat jou identificeert. Organisatoren zien ze als hun statistieken."],
      },
      {
        heading: "Wat je ons stuurt",
        body: [
          "Een melding (“Klopt dit niet?”) bewaart de reden en je notitie. Een toegangsverzoek bewaart de organisatie, naam, e-mail en notitie die je invult, zodat we het account kunnen aanmaken en kunnen antwoorden.",
        ],
      },
      {
        heading: "Organisatoraccounts",
        body: [
          "Organisatoren loggen in met een e-mailadres en een wachtwoord dat wij uitgeven; het e-mailadres wordt bewaard om het account te laten werken. Posters en logo's die ze uploaden zijn openbaar. De AI van Anthropic leest die posters om de gegevens van het evenement eruit te halen — de poster, verder niets.",
        ],
      },
      {
        heading: "Waar het draait",
        body: [
          "Gehost bij Vercel; database en afbeeldingen bij Supabase. Lettertypen komen van ons eigen domein. De analytics van Vercel telt paginaweergaven en een paar tikken (een opslag, een volger, herinneringen aan, een installatie, een deling) zonder cookies — een gehashte code die dagelijks wisselt, geen naam, geen tracking over sites heen. Eén cookie onthoudt je taal.",
        ],
      },
    ],
    contact: (email) => `Vragen, of wil je iets laten verwijderen? Mail naar ${email}.`,
    updated: "Laatst bijgewerkt op 24 september 2026.",
  },
};

export function AboutScreen({ contact }: { contact: string | null }) {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = COPY[locale];

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/profile");
  }

  return (
    <div className="flex min-h-dvh flex-col pb-10">
      <TopBar title={copy.title} onBack={goBack} />

      <div className="flex flex-col gap-5 px-4 pt-2">
        <div className="flex flex-col gap-2">
          <Wordmark />
          <p className="t-meta text-ink-muted">{copy.meta}</p>
        </div>

        {copy.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-1.5">
            <h2 className="t-heading text-ink">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="t-body text-ink">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        {contact ? (
          <p className="t-body text-ink">
            {copy.contact(contact).replace(contact, "")}
            <a href={`mailto:${contact}`} className="text-accent underline-offset-2 hover:underline">
              {contact}
            </a>
            .
          </p>
        ) : null}

        <p className="t-caption text-ink-muted">{copy.updated}</p>
      </div>
    </div>
  );
}
