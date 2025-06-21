import Chart from "chart.js/auto"
import { useEffect, useState } from "preact/hooks"
import { z } from "zod/v4"
import { ZTransaction } from "../deno_kv/schemas.ts"
import moment from "moment"

const test_data = [
    {
        id: 0,
        date: new Date("2025-01-01 00:00:00"),
        amount: 100.00,
        currency: "US",
        comment: "Paycheck"
    },
    {
        id: 1,
        date: new Date("2025-01-02 00:00:00"),
        amount: 200.00,
        currency: "US",
        comment: "Venmo"
    },
    {
        id: 2,
        date: new Date("2025-01-03 00:00:00"),
        amount: -50.00,
        currency: "US",
        comment: "dinner"
    },
    {
        id: 3,
        date: new Date("2025-01-04 00:00:00"),
        amount: -20.86,
        currency: "US",
        comment: "lunch with friends"
    },
    {
        id: 4,
        date: new Date("2025-01-05 00:00:00"),
        amount: 10.43,
        currency: "US",
        comment: "Venmo for lunch"
    },
    {
        id: 5,
        date: new Date("2025-01-06 00:00:00"),
        amount: -49.99,
        currency: "US",
        comment: "subscription payment"
    },
    {
        id: 6,
        date: new Date("2025-01-07 00:00:00"),
        amount: 85.00,
        currency: "US",
        comment: "bet winnings"
    }
]

type Transaction = z.infer<typeof ZTransaction>

interface ChartProps {
    data: Array<Transaction>
}

export default (props: ChartProps) => {
    const [chartData, setChartData] = useState<Array<Transaction>>([])
    const { data } = props

    useEffect(() => {
        setChartData(data)
    },[data])

    const getData = () => {
        let total = 0
        const data = {
            datasets: [{
                label: "Net Cash Flow",
                data: chartData.map((item) => {
                    total += item.amount
                    return new Object({x: item.date, y: total})
                })
            }]
        }
        return data
    }

    return <canvas id="chart" ref={(dom) => {
            if (dom) {
                new Chart(
                    dom,
                    {
                        type: "line",
                        data: getData()
                    }
                )
            }

            return () => {
                console.debug("Chart cleanup called...",dom)
            }
        }
    }></canvas>
}