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

const styles = {
  primary: {
    solid: "border border-solid border-transparent rounded-full" + 
        "px-8 py-3 pb-1 pt-1.5 bg-purp text-white font-bold" + 
        "transition duration-300 ease-out hover:rounded hover:bg-minty hover:text-black",
    inverted: "border-2 border-solid rounded-full" + 
        "px-8 py-3 pb-1 pt-1.5 bg-transparent text-purp font-bold" +
        "transition delay-300 ease-out hover:rounded hover:bg-purp hover:text-black"
  },
  secondary: {
    
  },
  neutral: {
    solid: "border border-solid border-transparent rounded-full" + 
        "px-8 py-3 pb-1 pt-1.5 bg-carbon text-white font-bold" + 
        "transition delay-300 ease-out hover:rounded hover:bg-purp hover:text-black",
    inverted: "border-2 border-solid rounded-full" +
        "px-8 py-3 pt-1.5 bg-transparent text-purp font-bold" +
        "transition delay-300 ease-out hover:rounded hover:bg-purp hover:text-black"
  },
  danger: {
    solid: "",
    inverted: ""
  },
  warning: {
    solid: "",
    inverted: ""
  },
  success: {
    solid: "",
    inverted: ""
  },
  info: {
    solid: "",
    inverted: ""
  }
}


export default (props: ButtonProps) => {
  
  switch (props.colorStyle) {
    case ColorStyle.enum.primary:
      if (props.buttonStyle === "solid") return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className={styles.primary.solid}
      />

      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className={styles.primary.inverted}
        />
        
    case ColorStyle.enum.neutral:
      if (props.buttonStyle === "solid") return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={styles.neutral.solid}
      />

      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={styles.neutral.inverted}
      />

    default:
      return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className={styles.neutral.solid} />
  }

}
