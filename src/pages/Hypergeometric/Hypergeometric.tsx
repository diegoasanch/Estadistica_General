import React, { useEffect, useState } from 'react'
import ProbabilityChart from '../../components/ProbabilityChart'
import { IOperationType } from '../../types/pages'
import { handleHighlight } from '../../utils/arrays'

import PunctualOrAccumulated from '../../components/PunctualOrAccumulated'
import ResultGroup from '../../components/ResultGroup'
import ProbabilityTable from '../../components/ProbabilityTable'
import { useDebounce } from 'react-use'

import {
    IBarChartItem,
    ITable,
    IProbabilities,
    IResult,
    Highlight,
} from '../../types/tables'
import { Spinner } from '@blueprintjs/core'
import PageTemplate from '../PageTemplate'
import { PrecisionContext } from '../../contexts/inputs'

import HypergeometricInput from '../../components/InputGroups/HypergeometricInput'
import {
    createTable,
    defaultTable,
    getAnalysis,
    getProbabilities,
} from '../../functions/hypergeometric'
import { defaultResults } from '../../functions/shared'
import { showToast } from '../../utils/toaster'
import NoGreater from '../../components/NoGreater'
import NoNegative from '../../components/NoNegative'
import { INPUT_DEBOUNCE } from '../../utils/constants'

const validateInput = (N: number, R: number, n: number, r: number): void => {
    if (R > N) showToast(<NoGreater a="R" b="N" />, 'danger')
    if (n > N) showToast(<NoGreater a="n" b="N" />, 'danger')
    if (r > n) showToast(<NoGreater a="r" b="n" />, 'danger')
    if (r > R) showToast(<NoGreater a="r" b="R" />, 'danger')
    if ([N, R, n, r].some((item) => item < 0))
        showToast(<NoNegative />, 'danger')
}

function Hypergeometric() {
    const [totalSize, setTotalSize] = useState(NaN) // .............. N
    const [totalSuccess, setTotalSuccess] = useState(NaN) // ........ R
    const [sampleSize, setSampleSize] = useState(NaN) // ............ n
    const [successFound, setSuccessFound] = useState<number>(NaN) //. r

    const [validInput, setValidInput] = useState(false)

    const [roundPrecision, setRoundPrecision] = useState(5)
    const [results, setResults] = useState<IResult[]>(defaultResults)
    const [validResults, setValidResults] = useState(false)
    const [probabilities, setProbabilities] = useState<IProbabilities>()

    const [tableData, setTableData] = useState<ITable>()
    const [chartData, setChartData] = useState<IBarChartItem[]>()

    const [highlight, setHighlight] = useState<Highlight>()
    const [opType, setOpType] = useState<IOperationType>('p')

    const handleType = (r: number, n: number, N: number, R: number) => {
        setProbabilities(getProbabilities(r, n, N, R))
    }

    // For the panel animation
    useEffect(() => {
        setProbabilities(undefined)
        validateInput(totalSize, totalSuccess, sampleSize, successFound)
    }, [totalSize, totalSuccess, sampleSize, successFound])

    // For the  calculations
    useDebounce(
        () => {
            handleType(successFound, sampleSize, totalSize, totalSuccess)
        },
        INPUT_DEBOUNCE,
        [totalSize, totalSuccess, sampleSize, successFound],
    )

    // For the higlights
    useEffect(() => {
        const toHighlight = handleHighlight(opType, successFound, sampleSize)
        setHighlight(toHighlight)
    }, [successFound, sampleSize, opType])

    // for rendering the loaders
    useEffect(() => {
        setTableData(undefined)
        setChartData(undefined)
        setResults(defaultResults)
        setValidResults(false)
        setProbabilities(undefined)
    }, [totalSize, totalSuccess, sampleSize])

    // Debouncing the table and chart calculations
    useDebounce(
        () => {
            if (validInput) {
                console.time('Table generation ⌚')
                const newTable = createTable(
                    sampleSize,
                    totalSize,
                    totalSuccess,
                )
                console.timeEnd('Table generation ⌚')

                console.time('Analysis generation ⌚')
                const analysis = getAnalysis(
                    sampleSize,
                    totalSize,
                    totalSuccess,
                ) // TODO: add J(r) (1)
                console.timeEnd('Analysis generation ⌚')

                console.time('Chart data ⌚')
                const probs_from_table = newTable.content.map((item) => ({
                    label: item[0],
                    value: item[1],
                }))
                console.timeEnd('Chart data ⌚')

                setTableData(newTable)
                setResults(analysis) // TODO: add J(r) (1)
                setChartData(probs_from_table)
                setValidResults(true)
            }
        },
        INPUT_DEBOUNCE,
        [totalSize, totalSuccess, sampleSize, validInput],
    )

    useEffect(() => {
        const valid = !!(totalSize && totalSuccess && sampleSize)
        setValidInput(valid)
    }, [totalSize, totalSuccess, sampleSize])

    return (
        <PrecisionContext.Provider value={roundPrecision}>
            <PageTemplate
                noInputs={{ a: 'N', b: 'n', c: 'R' }}
                validInput={validInput}
                input={
                    <HypergeometricInput
                        handleTotalSize={setTotalSize} // N
                        handleTotalSuccess={setTotalSuccess} // R
                        handleSampleSize={setSampleSize} // n
                        handleSuccessFound={setSuccessFound} // r
                        setRoundPrecision={setRoundPrecision}
                        extraPanel={
                            <PunctualOrAccumulated
                                handleTab={setOpType}
                                variable={successFound}
                                validInput={validInput}
                                probabilities={probabilities}
                                varLabel="r"
                            />
                        }
                    />
                }
                analysis={
                    <ResultGroup
                        validResults={validResults}
                        results={results}
                    />
                }
                table={
                    <ProbabilityTable
                        table={tableData || defaultTable}
                        isLoading={!tableData}
                        highlight={highlight}
                    />
                }
                chart={
                    chartData ? (
                        <ProbabilityChart
                            variable="r"
                            data={chartData}
                            highlight={highlight}
                        />
                    ) : (
                        <Spinner size={100} />
                    )
                }
            />
        </PrecisionContext.Provider>
    )
}

export default Hypergeometric
