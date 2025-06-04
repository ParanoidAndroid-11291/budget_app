import Chart from "chart.js/auto"

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

export default () => {

    return <canvas id="chart" ref={(dom) => {
            if (dom) {
                new Chart(
                    dom,
                    {
                        type: "line",
                        data: {
                            datasets: test_data.map((data) => Object.create({x: data.date, y: data.amount}))
                        }
                    }
                )
            }

            return () => {
                console.debug("Chart cleanup called...",dom)
            }
        }
    }></canvas>
}