import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export default (props: JSX.HTMLAttributes<HTMLInputElement>) => {
    return (
        <div>
            <input type="date" id="start_date"/>
            <input type="date" id="end_date" />
        </div>
    )
}