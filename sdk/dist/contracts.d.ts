import { type PublicClient, type WalletClient } from "viem";
import { type ChainAddresses } from "./addresses.js";
export declare function getContracts(addrs: ChainAddresses, publicClient: PublicClient, walletClient?: WalletClient): {
    stakeManager: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | import("abitype").Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<import("abitype").Abi, string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: `0x${string}`;
        abi: import("abitype").Abi;
    };
    capacityRegistry: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | import("abitype").Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<import("abitype").Abi, string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: `0x${string}`;
        abi: import("abitype").Abi;
    };
    backpressurePool: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | import("abitype").Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<import("abitype").Abi, string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: `0x${string}`;
        abi: import("abitype").Abi;
    };
    escrowBuffer: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | import("abitype").Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<import("abitype").Abi, string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: `0x${string}`;
        abi: import("abitype").Abi;
    };
    pipeline: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | import("abitype").Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<import("abitype").Abi, string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: `0x${string}`;
        abi: import("abitype").Abi;
    };
    gdaV1Forwarder: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | import("abitype").Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<import("abitype").Abi, string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: `0x${string}`;
        abi: import("abitype").Abi;
    };
    pricingCurve: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | import("abitype").Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<import("abitype").Abi, string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: `0x${string}`;
        abi: import("abitype").Abi;
    };
    completionTracker: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | import("abitype").Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<import("abitype").Abi, string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: `0x${string}`;
        abi: import("abitype").Abi;
    };
    offchainAggregator: {
        read: {
            [x: string]: (...parameters: [options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined] | [args: readonly unknown[], options?: import("viem").Prettify<import("viem").UnionOmit<import("viem").ReadContractParameters<import("abitype").Abi, string, readonly unknown[]>, "address" | "abi" | "functionName" | "args">> | undefined]) => Promise<import("viem").ReadContractReturnType>;
        };
        estimateGas: {
            [x: string]: (...parameters: [options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>] | [args: readonly unknown[], options: import("viem").Prettify<import("viem").UnionOmit<import("viem").EstimateContractGasParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined>, "address" | "abi" | "functionName" | "args">>]) => Promise<import("viem").EstimateContractGasReturnType>;
        };
        simulate: {
            [x: string]: <chainOverride extends import("viem").Chain | undefined = undefined, accountOverride extends import("viem").Account | import("abitype").Address | undefined = undefined>(...parameters: [options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined] | [args: readonly unknown[], options?: Omit<import("viem").SimulateContractParameters<import("abitype").Abi, string, readonly unknown[], import("viem").Chain | undefined, chainOverride, accountOverride>, "address" | "abi" | "functionName" | "args"> | undefined]) => Promise<import("viem").SimulateContractReturnType>;
        };
        createEventFilter: {
            [x: string]: <strict extends boolean | undefined = undefined>(...parameters: [options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                strict?: undefined;
                toBlock?: undefined;
                args?: undefined;
            }, options?: ({
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } & {
                strict?: strict | undefined;
            }) | undefined]) => Promise<import("viem").CreateContractEventFilterReturnType>;
        };
        getEvents: {
            [x: string]: (...parameters: [options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined] | [args?: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            } | undefined, options?: {
                strict?: boolean | undefined;
                blockHash?: `0x${string}` | undefined;
                fromBlock?: bigint | import("viem").BlockTag | undefined;
                toBlock?: bigint | import("viem").BlockTag | undefined;
            } | undefined]) => Promise<import("viem").GetContractEventsReturnType<import("abitype").Abi, string>>;
        };
        watchEvent: {
            [x: string]: (...parameters: [options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined] | [args: readonly unknown[] | {
                [x: string]: unknown;
                address?: undefined;
                abi?: undefined;
                args?: undefined;
                eventName?: undefined;
                fromBlock?: undefined;
                onError?: undefined;
                onLogs?: undefined;
                strict?: undefined;
                poll?: undefined;
                batch?: undefined;
                pollingInterval?: undefined;
            }, options?: {
                batch?: boolean | undefined | undefined;
                pollingInterval?: number | undefined | undefined;
                strict?: boolean | undefined;
                fromBlock?: bigint | undefined;
                onError?: ((error: Error) => void) | undefined | undefined;
                onLogs: import("viem").WatchContractEventOnLogsFn<import("abitype").Abi, string, undefined>;
                poll?: true | undefined | undefined;
            } | undefined]) => import("viem").WatchContractEventReturnType;
        };
        address: `0x${string}`;
        abi: import("abitype").Abi;
    };
};
export type BPEContracts = ReturnType<typeof getContracts>;
