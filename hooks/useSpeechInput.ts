'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// The Web Speech API isn't in the standard DOM lib types — declare the
// minimal surface we actually use so we can stay strict / no-any.
type SpeechAlternative = { readonly transcript: string };
type SpeechResult = {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: SpeechAlternative;
};
type SpeechResultList = {
  readonly length: number;
  readonly [index: number]: SpeechResult;
};
type SpeechEvent = { readonly results: SpeechResultList };
type SpeechErrorEvent = { readonly error: string };

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechErrorEvent) => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type UseSpeechInput = {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
};

/**
 * Thin wrapper over the browser SpeechRecognition API. Streams interim +
 * final transcripts into `onTranscript` so the compose input fills live as
 * the user speaks.
 */
export function useSpeechInput(onTranscript: (text: string) => void): UseSpeechInput {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const cbRef = useRef(onTranscript);

  useEffect(() => {
    cbRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    setSupported(getCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) return;
    // Tear down any previous session.
    recognitionRef.current?.abort();

    const rec = new Ctor();
    rec.lang =
      (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i += 1) {
        const result = e.results[i];
        if (result) transcript += result[0]?.transcript ?? '';
      }
      cbRef.current(transcript.trim());
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };
    rec.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      // start() throws if called while already running — ignore.
      setListening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { supported, listening, start, stop };
}
