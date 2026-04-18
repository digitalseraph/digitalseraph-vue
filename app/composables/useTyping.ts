import { ref, type Ref } from "vue";

interface TypingOptions {
  text: string;
  speed?: number;
  reduced?: Ref<boolean>;
}

export function useTyping(opts: TypingOptions) {
  const displayed = ref("");
  const done = ref(false);
  let index = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const speed = opts.speed ?? 40;

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function start() {
    stop();
    if (opts.reduced?.value) {
      displayed.value = opts.text;
      done.value = true;
      return;
    }
    index = displayed.value.length;
    timer = setInterval(() => {
      index++;
      displayed.value = opts.text.slice(0, index);
      if (index >= opts.text.length) {
        done.value = true;
        stop();
      }
    }, speed);
  }

  function reset() {
    stop();
    displayed.value = "";
    done.value = false;
    index = 0;
  }

  return { displayed, done, start, stop, reset };
}
