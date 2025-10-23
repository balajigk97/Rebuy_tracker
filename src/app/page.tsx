import Image from "next/image";
import { RoleSelector } from "@/components/auth/role-selector";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const bgImage = PlaceHolderImages.find((img) => img.id === "login-bg");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          priority
          className="object-cover -z-10 brightness-[.25]"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="w-full max-w-md p-4">
        <Card className="bg-card/80 backdrop-blur-sm border-white/20">
            <CardHeader className="text-center">
                <CardTitle className="text-4xl font-headline text-primary-foreground">Rebuy Tracker</CardTitle>
                <CardDescription className="text-accent">Welcome to the table. Select your role to begin.</CardDescription>
            </CardHeader>
            <CardContent>
                <RoleSelector />
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
