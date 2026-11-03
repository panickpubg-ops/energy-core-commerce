import { useEffect } from "react";
import { useDb } from "@/lib/db";
import { validTrackingId } from "@/lib/site-config";

/** Injects GA4 / GTM / Meta Pixel once, using only IDs that pass strict format checks. */
export function TrackingTags() {
  const { ga4Id, gtmId, metaPixelId, allowIndexing } = useDb((s) => s.config.seo);
  useEffect(() => {
    const add = (id: string, src?: string, code?: string) => {
      if (document.getElementById(id)) return;
      const el = document.createElement("script");
      el.id = id;
      if (src) { el.async = true; el.src = src; }
      if (code) el.text = code;
      document.head.appendChild(el);
    };
    if (validTrackingId.ga4(ga4Id)) {
      add("ga4-src", `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`);
      add("ga4-init", undefined, `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4Id}');`);
    }
    if (validTrackingId.gtm(gtmId))
      add("gtm-init", undefined, `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`);
    if (validTrackingId.pixel(metaPixelId))
      add("fb-pixel", undefined, `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`);
    let robots = document.querySelector('meta[name="robots"][data-store]');
    if (!allowIndexing) {
      if (!robots) { robots = document.createElement("meta"); robots.setAttribute("name", "robots"); robots.setAttribute("data-store", ""); document.head.appendChild(robots); }
      robots.setAttribute("content", "noindex");
    } else robots?.remove();
  }, [ga4Id, gtmId, metaPixelId, allowIndexing]);
  return null;
}
