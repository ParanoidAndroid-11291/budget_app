import Chart from "chart.js/auto"
import { useEffect, useState } from "preact/hooks"
import { z } from "zod/v4"
import { ZTransaction } from "../deno_kv/schemas.ts"

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