import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { signal } from "@preact/signals";
import moment from "moment";
import { z } from "zod/v4"

const ModeType = z.literal("range").optional()
type ModeType = z.infer<typeof ModeType>

const StartDate = z.iso.date()
type StartDate = z.infer<typeof StartDate>
const EndDate = z.iso.date()
type EndDate = z.infer<typeof EndDate>

const startDateSignal = signal(moment().format('YYYY-MM-DD'))
const endDateSignal = signal(moment().format('YYYY-MM-DD'))

interface DatePickerProps extends JSX.HTMLAttributes<HTMLInputElement> {
    mode?: ModeType;
    startDate?: StartDate;
    endDate?: EndDate;
}

export default (props: DatePickerProps) => {

    if (props.mode){
        try {
            const startDate = props.startDate ? StartDate.parse(props.startDate) : startDateSignal.value
            const endDate = props.endDate ? EndDate.parse(props.endDate) : endDateSignal.value

            return (
                <div class="flex justify-evenly items-center w-fit px-5 py-1.5 gap-2 bg-white border border-carbon rounded-full">
                    <input 
                        { ...props }
                        type="date" 
                        name="start" 
                        id="start" 
                        disabled={!IS_BROWSER || props.disabled}
                        value={startDate}
                    />
                    <span>to</span>
                    <input 
                        { ...props }
                        type="date" 
                        name="end" 
                        id="end" 
                        disabled={!IS_BROWSER || props.disabled}
                        value={endDate}
                    />
                </div>
            )
        } catch(err) {
            if (err instanceof z.ZodError) console.error("DatePicker",err.issues)
            else console.error("DatePicker",err)
            
            return <></>
        }
    }

    try {
        const startDate = props.startDate ? StartDate.parse(props.startDate) : startDateSignal.value

        return <input
            { ...props }
            className="py-1.5 px-2 bg-white border border-carbon rounded-full"
            type="date" 
            name={props.name} 
            id={props.id} 
            disabled={!IS_BROWSER || props.disabled} 
            value={startDate}
        />

    } catch(err) {
        if (err instanceof z.ZodError) console.error("DatePicker",err.issues)
        else console.error("DatePicker",err)
        
        return <></>
    }
}