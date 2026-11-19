// Ambient declarations: things that exist at run time (loaded by a <script> tag, say) but were never imported.

/** A namespace groups types and functions under one global name. Use it only for old global libraries. */
declare namespace Analytics {
  type EventName = 'page_view' | 'click' | 'purchase';
  interface Event {
    name: EventName;
    at: number;
  }
  function track(name: EventName): Event;
}

/** `declare const`: a global variable the script tag created */
declare const ANALYTICS_VERSION: string;
