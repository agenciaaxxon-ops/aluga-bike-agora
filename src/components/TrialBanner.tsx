import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TrialBannerProps {
  trialEndsAt: string | null;
  subscriptionStatus: string | null;
}

export const TrialBanner = ({ trialEndsAt, subscriptionStatus }: TrialBannerProps) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!trialEndsAt || subscriptionStatus !== 'trial') return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(trialEndsAt);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Período de teste expirado");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      setTimeLeft(`${minutes}m ${seconds}s`);
      setIsExpired(false);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [trialEndsAt, subscriptionStatus]);

  if (subscriptionStatus !== 'trial' || !trialEndsAt) return null;

  return (
    <Alert className={`mb-6 ${isExpired ? 'border-destructive bg-destructive/10' : 'border-warning bg-warning/10'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isExpired ? (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          ) : (
            <Clock className="h-5 w-5 text-warning" />
          )}
          <AlertDescription className="font-medium">
            {isExpired ? (
              <span className="text-destructive">Período de teste expirado - Assine agora para continuar usando</span>
            ) : (
              <>
                <span className="text-warning">Período de teste: </span>
                <span className="font-bold text-foreground">{timeLeft}</span>
                <span className="text-muted-foreground ml-2">restantes</span>
              </>
            )}
          </AlertDescription>
        </div>
        <Button 
          variant={isExpired ? "destructive" : "default"}
          size="sm"
          onClick={() => navigate('/planos')}
          className="ml-4"
        >
          {isExpired ? 'Assinar Agora' : 'Ver Planos'}
        </Button>
      </div>
    </Alert>
  );
};
