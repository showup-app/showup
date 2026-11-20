import { useCallback, useState } from "react";
import { ResponseObject } from "../services/api";

type AsyncState<T> =
	| { status: "loading"; error: null; data: null }
	| { status: "error"; error: string; data: null }
	| { status: "success"; error: null; data: T };

const useAsync = <T>(asyncFunction: () => Promise<ResponseObject<T>>) => {
	const [state, setState] = useState<AsyncState<T>>({
		status: "loading",
		data: null,
		error: null,
	});

	const execute = useCallback(async () => {
		const res = await asyncFunction();
		if (res.ok) {
			setState({
				status: "success",
				data: res.data,
				error: null,
			});
		} else {
			setState({
				status: "error",
				error: res.error,
				data: null,
			});
		}
	}, [asyncFunction]);

	const setData = useCallback((data: T | ((prev: T) => T)) => {
		setState((prev) => {
			if (prev.status !== "success") return prev;

			return {
				status: "success",
				data: typeof data === "function" ? (data as (prev: T) => T)(prev.data) : data,
				error: null,
			};
		});
	}, []);

	return {
		...state,
		execute,
		setData,
	};
};

export default useAsync;
