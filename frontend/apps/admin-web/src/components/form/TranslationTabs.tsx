import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tr } from "@/i18n/tr";
import { LANGUAGES, type Language } from "@/lib/translations";

interface TranslationTabsProps {
  value: Language;
  onValueChange: (language: Language) => void;
  errors?: Partial<Record<Language, unknown>> | undefined;
  children: (language: Language) => ReactNode;
}

// Controlled by the form, so a failed submit can switch to the language that has errors
export function TranslationTabs({ value, onValueChange, errors, children }: TranslationTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next: Language) => {
        onValueChange(next);
      }}
    >
      <TabsList aria-label="Dil">
        {LANGUAGES.map((language) => (
          <TabsTrigger key={language} value={language}>
            {language.toUpperCase()}
            {errors?.[language] ? (
              <span className="text-destructive">
                <span aria-hidden="true">•</span>
                <span className="sr-only">{tr.form.languageHasErrors}</span>
              </span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
      {LANGUAGES.map((language) => (
        // keepMounted: the inactive language's inputs stay in the DOM, hidden, with their values
        <TabsContent key={language} value={language} keepMounted>
          {children(language)}
        </TabsContent>
      ))}
    </Tabs>
  );
}
