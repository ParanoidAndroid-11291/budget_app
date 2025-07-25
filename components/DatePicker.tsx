import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export default (props: JSX.HTMLAttributes<HTMLInputElement>) => {
    return (
        <div class="flex justify-evenly items-center w-1/3 py-1.5 border rounded-full">
            <input type="date" name="start" id="start" />
            <span>-</span>
            <input type="date" name="end" id="end" />
        </div>
    )
}