import { JSX } from "preact"
import { IS_BROWSER } from "$fresh/runtime.ts"

export default (props: JSX.HTMLAttributes<HTMLInputElement>) => {
    return <input 
    className="border-2 border-stormy rounded-full bg-white px-2 py-1"
    disabled={!IS_BROWSER || props.disabled}
    placeholder={props.placeholder}
    value={props.value}
    />
}