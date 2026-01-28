declare global {
  interface Window {
    fbq: any;
  }
}

interface UserData {
  em?: string; // email
  ph?: string; // phone
  fn?: string; // first name
  ln?: string; // last name
  ct?: string; // city
  st?: string; // state
  zp?: string; // zip
  country?: string; // country
  external_id?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
}

// Função para gerar ID único
function generateEventId(): string {
  // @ts-ignore
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    // @ts-ignore
    ? crypto.randomUUID() 
    : Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Helper para obter cookies
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

/**
 * Envia evento para o Facebook Pixel e Conversion API (CAPI) com deduplicação.
 */
export async function trackFacebookEvent(
  eventName: string,
  customData: Record<string, any> = {},
  userData: UserData = {}
) {
  const eventId = generateEventId();
  const eventSourceUrl = window.location.href;

  // Tentar obter fbp e fbc dos cookies automaticamente se não fornecidos
  const fbp = getCookie('_fbp');
  const fbc = getCookie('_fbc');

  const enrichedUserData = {
    ...userData,
    fbp: userData.fbp || fbp,
    fbc: userData.fbc || fbc,
    client_user_agent: navigator.userAgent,
  };

  // 1. Enviar para o Pixel (Client-side)
  // Nota: Para eventos padrão (Lead, Purchase, etc), usa-se 'track'. Para customizados, 'trackCustom'.
  // Vamos assumir que se o nome for um evento padrão, usamos track, senão trackCustom.
  // Lista de eventos padrão comuns: 'PageView', 'Lead', 'CompleteRegistration', 'Purchase', 'AddToCart', 'ViewContent', 'Contact'.
  
  const standardEvents = [
    'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration', 'Contact', 
    'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout', 'Lead', 
    'Purchase', 'Schedule', 'Search', 'StartTrial', 'SubmitApplication', 'Subscribe', 
    'ViewContent', 'PageView'
  ];

  const method = standardEvents.includes(eventName) ? 'track' : 'trackCustom';

  if (typeof window.fbq === 'function') {
    // Pixel suporta 4 argumentos: track/trackCustom, eventName, params, { eventID }
    // Mas a assinatura pode variar. Geralmente é fbq('track', 'Lead', params, { eventID: '...' })
    window.fbq(method, eventName, customData, { eventID: eventId });
  }

  // 2. Enviar para a CAPI (Server-side) via nosso backend
  // Não esperamos a resposta para não bloquear a UI, mas logamos erro se falhar
  fetch('/api/fb-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl,
      userData: enrichedUserData,
      customData,
      actionSource: 'website',
    }),
  }).catch((error) => {
    console.error('Falha ao enviar evento CAPI:', error);
  });
}
