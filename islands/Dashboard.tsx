import Button from "../components/Button.tsx";
import DatePicker from "../components/DatePicker.tsx";
import moment from "moment";

export default () => {
    return (
        <div className=" w-screen grid grid-cols-2 auto-rows-auto">
            <div className="col-span-full w-full h-fit p-3 flex items-center gap-3 bg-foggy rounded-b-xl shadow-xl">
                <DatePicker 
                mode="range" 
                startDate={moment().subtract(30, 'days').format("YYYY-MM-DD")} 
                endDate={moment().format("YYYY-MM-DD")}/>
                <Button colorStyle="primary" buttonStyle="solid">Add Transaction</Button>
            </div>
            <div>Card 1 Placeholder</div>
            <div>Card 2 Placeholder</div>
        </div>
    )
}