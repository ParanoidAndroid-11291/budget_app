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

const LineStyles = z.object({ solid: z.string(), inverted: z.string() })

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  colorStyle: ColorStyle,
  buttonStyle: ButtonStyle
}


export default (props: ButtonProps) => {
  
  switch (props.colorStyle) {
    case ColorStyle.enum.primary:
      if (props.buttonStyle === "solid") return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className="border border-solid border-transparent rounded-full px-8 py-3 pb-1 pt-1.5 bg-purp text-white font-bold transition duration-300 ease-in-out hover:rounded hover:bg-minty hover:text-black" 
      />

      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className="transition delay-300 ease-out border-2 border-solid rounded-full hover:rounded px-8 py-3 pb-1 pt-1.5 bg-transparent hover:bg-minty text-purp hover:text-white font-bold"
        />

    default:
      return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className="transition delay-300 ease-out border border-solid border-transparent rounded-full hover:rounded px-8 py-3 pb-1 pt-1.5 bg-carbon hover:bg-purp text-white hover:text-black font-bold" />
  }

}
