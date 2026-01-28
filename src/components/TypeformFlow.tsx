import { useState, useEffect } from "react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Instagram } from "lucide-react";

type Step = 
  | "intro"
  | "name"
  | "pregnant"
  | "weeks"
  | "whatsapp"
  | "employed"
  | "thank-you"
  | "not-pregnant"
  | "employed-disqualified";

interface FormData {
  name: string;
  pregnant: boolean | null;
  weeks: string;
  whatsapp: string;
  employed: boolean | null;
}

export default function TypeformFlow() {
  const [step, setStep] = useState<Step>("intro");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    pregnant: null,
    weeks: "",
    whatsapp: "",
    employed: null,
  });

  const handleNext = (nextStep: Step) => {
    setStep(nextStep);
  };

  const renderStep = () => {
    switch (step) {
      case "intro":
        return <IntroStep onNext={() => handleNext("name")} />;
      case "name":
        return (
          <NameStep
            value={formData.name}
            onChange={(name) => setFormData({ ...formData, name })}
            onNext={() => handleNext("pregnant")}
          />
        );
      case "pregnant":
        return (
          <PregnantStep
            onSelect={(pregnant) => {
              setFormData({ ...formData, pregnant });
              handleNext(pregnant ? "weeks" : "not-pregnant");
            }}
          />
        );
      case "weeks":
        return (
          <WeeksStep
            onSelect={(weeks) => {
              setFormData({ ...formData, weeks });
              handleNext("whatsapp");
            }}
          />
        );
      case "whatsapp":
        return (
          <WhatsappStep
            value={formData.whatsapp}
            onChange={(whatsapp) => setFormData({ ...formData, whatsapp })}
            onNext={() => handleNext("employed")}
          />
        );
      case "employed":
        return (
          <EmployedStep
            onSelect={(employed) => {
              setFormData({ ...formData, employed });
              
              if (!employed) {
                // Lead qualificado: Gestante e não empregada (conforme lógica do fluxo)
                if (typeof window.fbq === 'function') {
                  window.fbq('trackCustom', 'Lead Qualificado');
                }
              } else {
                // Lead desqualificado: Empregada
                if (typeof window.fbq === 'function') {
                  window.fbq('trackCustom', 'Lead Desqualificado');
                }
              }

              handleNext(employed ? "employed-disqualified" : "thank-you");
            }}
          />
        );
      case "thank-you":
        return <ThankYouStep formData={formData} />;
      case "not-pregnant":
        return <NotPregnantStep />;
      case "employed-disqualified":
        return <EmployedDisqualifiedStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Logo do Escritório" className="h-16 w-auto" />
        </div>
        <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 animate-fade-in">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

function IntroStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-6 animate-slide-in">
      <h1 className="text-2xl md:text-3xl font-bold text-card-foreground">
        Descubra se você tem direito ao Auxílio Maternidade
      </h1>
      <p className="text-muted-foreground text-lg">
        Milhares de gestantes estão recebendo até <strong className="text-primary">R$ 6.480,00</strong> do governo. 
        Assista ao vídeo e descubra se você também tem direito!
      </p>
      {/* <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg">
        <iframe
          className="w-full h-full"
          src="https://www.youtube.com/embed/dQw4w9WgXcQ"
          title="Auxílio Maternidade"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div> */}
      <Button
        onClick={onNext}
        size="lg"
        className="w-full md:w-auto px-8 py-6 text-lg font-semibold"
      >
        QUERO SABER SE TENHO DIREITO
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </div>
  );
}

function NameStep({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-in">
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">Pergunta 1 de 4</span>
        <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
          Qual seu nome?
        </h2>
      </div>
      <Input
        type="text"
        placeholder="Digite seu nome completo"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-lg py-6 bg-white border-input text-card-foreground"
        autoFocus
      />
      <Button
        type="submit"
        size="lg"
        disabled={!value.trim()}
        className="w-full md:w-auto px-8 py-6 text-lg font-semibold"
      >
        Continuar
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </form>
  );
}

function PregnantStep({ onSelect }: { onSelect: (pregnant: boolean) => void }) {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">Pergunta 2 de 4</span>
        <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
          Você está grávida?
        </h2>
      </div>
      <div className="grid gap-4">
        <OptionButton onClick={() => onSelect(true)} label="SIM" />
        <OptionButton onClick={() => onSelect(false)} label="NÃO" />
      </div>
    </div>
  );
}

function WeeksStep({ onSelect }: { onSelect: (weeks: string) => void }) {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">Pergunta 3 de 4</span>
        <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
          De quantas semanas é a gestação?
        </h2>
      </div>
      <div className="grid gap-4">
        <OptionButton onClick={() => onSelect("menos-28")} label="Menos de 28 semanas" />
        <OptionButton onClick={() => onSelect("mais-28")} label="Mais de 28 semanas" />
      </div>
    </div>
  );
}

function WhatsappStep({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (val: string) => void;
  onNext: () => void;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-slide-in">
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">Pergunta 4 de 4</span>
        <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
          Qual o seu WhatsApp para te explicarmos o que fazer para receber o auxílio maternidade de R$ 6.480?
        </h2>
      </div>
      <Input
        type="tel"
        placeholder="(00) 00000-0000"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-lg py-6 bg-white border-input text-card-foreground"
        autoFocus
      />
      <Button
        type="submit"
        size="lg"
        disabled={!value.trim()}
        className="w-full md:w-auto px-8 py-6 text-lg font-semibold"
      >
        Continuar
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </form>
  );
}

function EmployedStep({ onSelect }: { onSelect: (employed: boolean) => void }) {
  return (
    <div className="space-y-6 animate-slide-in">
      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">Última pergunta</span>
        <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
          Você está trabalhando de carteira assinada no momento?
        </h2>
      </div>
      <div className="grid gap-4">
        <OptionButton onClick={() => onSelect(true)} label="SIM" />
        <OptionButton onClick={() => onSelect(false)} label="NÃO" />
      </div>
    </div>
  );
}

function ThankYouStep({ formData }: { formData: FormData }) {
  const [countdown, setCountdown] = useState(5);

  const getMessage = () => {
    const pregnantText = formData.pregnant ? "Sim" : "Não";
    const weeksText = formData.weeks === "menos-28" ? "Menos de 28 semanas" : "Mais de 28 semanas";
    const employedText = formData.employed ? "Sim" : "Não";
    
    return `Olá, quero solicitar meu auxílio-maternidade.

Meus dados:
Nome: ${formData.name}
Grávida: ${pregnantText}
Semanas: ${weeksText}
WhatsApp: ${formData.whatsapp}
Trabalhando: ${employedText}`;
  };

  const message = encodeURIComponent(getMessage());
  const whatsappLink = `https://wa.me/5527996383725?text=${message}`;

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      window.location.href = whatsappLink;
    }
  }, [countdown, whatsappLink]);

  return (
    <div className="text-center space-y-6 animate-slide-in">
      <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
        Obrigado, {formData.name}!
      </h2>
      <p className="text-muted-foreground text-lg">
        Seu cadastro foi realizado com sucesso!
      </p>
      
      <div className="bg-primary/10 p-6 rounded-xl border border-primary/20 space-y-2">
        <p className="font-semibold text-lg text-primary-foreground">
          Você será redirecionada para o WhatsApp do escritório em {countdown} segundos...
        </p>
        <p className="text-sm text-muted-foreground">
          Caso não seja redirecionada, <a href={whatsappLink} className="underline font-bold text-primary-foreground hover:text-primary">clique aqui</a>.
        </p>
      </div>

      <p className="text-sm text-muted-foreground">
        Fique atenta ao seu celular! 📱
      </p>
    </div>
  );
}

function NotPregnantStep() {
  return (
    <div className="text-center space-y-6 animate-slide-in">
      <div className="w-20 h-20 bg-info/20 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
        Obrigado pelo contato!
      </h2>
      <p className="text-muted-foreground text-lg">
        No momento, estamos atendendo somente gestantes para o auxílio maternidade. Mas fique à vontade para nos acompanhar nas redes sociais para outras novidades!
      </p>
    </div>
  );
}

function EmployedDisqualifiedStep() {
  return (
    <div className="text-center space-y-6 animate-slide-in">
      <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-card-foreground">
        Obrigado pelo seu interesse!
      </h2>
      <p className="text-muted-foreground text-lg">
        No momento, estamos priorizando o atendimento de gestantes desempregadas para o auxílio maternidade. Mas não deixe de nos acompanhar para outras oportunidades!
      </p>
      <a
        href="https://instagram.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-opacity"
      >
        <Instagram className="h-5 w-5" />
        Siga nosso Instagram
      </a>
    </div>
  );
}

function OptionButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 text-left text-lg font-medium border-2 border-input rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-card-foreground"
    >
      {label}
    </button>
  );
}
