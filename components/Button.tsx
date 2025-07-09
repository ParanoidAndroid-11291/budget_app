import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { z } from "zod/v4"

const ColorStyle = z.enum([
  "primary",
  "secondary",
  "neutral",
  "danger",
  "warning",
  "success",
  "info"
])

type ColorStyle = z.infer<typeof ColorStyle>

const ButtonStyle = z.enum(["solid","inverted"])
type ButtonStyle = z.infer<typeof ButtonStyle>

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  colorStyle: ColorStyle,
  buttonStyle: ButtonStyle
}


export default (props: ButtonProps) => {
  
  switch (props.colorStyle) {
    case ColorStyle.enum.primary:
      if (props.buttonStyle === "solid") return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors" 
      />

      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors" 
        />

    default:
      return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className="border border-solid border-transparent rounded px-6 pb-1 pt-1.5 bg-carbon text-white" />
  }

}
