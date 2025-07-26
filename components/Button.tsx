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

const styles = {
  primary: {
    solid: "border border-transparent rounded-full " + 
        "px-8 py-3 bg-purp text-white font-bold " + 
        "transition duration-300 ease-out hover:rounded-xl hover:bg-minty hover:text-carbon",
    inverted: "border-2 border-solid rounded-full " + 
        "px-8 py-3 bg-transparent text-purp font-bold " +
        "transition duration-300 ease-out hover:rounded-xl hover:bg-minty hover:text-carbon"
  },
  secondary: {
    solid: "border border-solid border-transparent rounded-full " +
        "px-8 py-3 bg-minty text-carbon font-bold " +
        "transition duration-300 ease-out hover:rounded-xl hover:bg-purp hover:text-white",
    inverted: "border-2 border-solid rounded-full " + 
        "px-8 py-3 bg-transparent text-minty font-bold " +
        "transition duration-300 ease-out hover:rounded-xl hover:bg-purp hover:text-white"
  },
  neutral: {
    solid: "border border-transparent rounded-full " + 
        "px-8 py-3 bg-carbon text-white font-bold " + 
        "transition duration-300 ease-out hover:rounded-xl hover:bg-purp",
    inverted: "border-2 border-solid rounded-full " +
        "px-8 py-3 bg-transparent text-carbon font-bold " +
        "transition duration-300 ease-out hover:rounded-xl hover:bg-purp hover:text-white"
  },
  danger: {
    solid: "border border-transparent rounded-full " + 
        "px-8 py-3 bg-danger text-white font-bold " + 
        "transition duration-300 ease-out hover:rounded-xl hover:bg-danger",
    inverted: "border-2 border-solid rounded-full" +
        "px-8 py-3 bg-transparent text-danger font-bold" +
        "transition duration-300 ease-out hover:rounded-xl hover:bg-danger hover:text-white"
  },
  warning: {
    solid: "border border-transparent rounded-full " + 
        "px-8 py-3 bg-warning text-carbon font-bold " + 
        "transition duration-300 ease-out hover:rounded-xl hover:bg-warning",
    inverted: "border-2 border-solid rounded-full " +
        "px-8 py-3 bg-transparent text-warning font-bold " +
        "transition duration-300 ease-out hover:rounded-xl hover:bg-warning hover:text-carbon"
  },
  success: {
    solid: "border border-transparent rounded-full " + 
        "px-8 py-3 bg-success text-white font-bold " + 
        "transition duration-300 ease-out hover:rounded-xl hover:bg-success",
    inverted: "border-2 border-solid rounded-full " +
        "px-8 py-3 bg-transparent text-success font-bold " +
        "transition duration-300 ease-out hover:rounded-xl hover:bg-success hover:text-white"
  }
}


export default (props: ButtonProps) => {
  console.debug("Button IS_BROWSER",IS_BROWSER)

  const { primary, secondary, neutral, danger, warning, success } = styles
  
  switch (props.colorStyle) {
    case ColorStyle.enum.primary:
      if (props.buttonStyle === "solid") return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className={primary.solid}
      />

      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className={primary.inverted}
        />

    case ColorStyle.enum.secondary:
      if (props.buttonStyle === "solid") return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={secondary.solid}
        />
      
      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={secondary.inverted}
        />
        
    case ColorStyle.enum.neutral:
      if (props.buttonStyle === "solid") return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={neutral.solid}
      />

      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={neutral.inverted}
      />

    case ColorStyle.enum.danger:
      if (props.buttonStyle === 'solid') return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={danger.solid}
      />

      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={danger.inverted}
      />

    case ColorStyle.enum.warning:
      if (props.buttonStyle === 'solid') return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={warning.solid}
      />

      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={warning.inverted}
      />

    case ColorStyle.enum.success:
      if (props.buttonStyle === 'solid') return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={success.solid}
      />

      else return <button {...props}
        disabled={!IS_BROWSER || props.disabled}
        className={success.inverted}
      />

    default:
      return <button {...props}
        disabled={!IS_BROWSER || props.disabled} 
        className={neutral.solid} />
  }

}
