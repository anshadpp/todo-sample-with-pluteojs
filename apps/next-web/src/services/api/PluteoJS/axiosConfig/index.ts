import axios from "axios";

import AxiosResponseInterceptors from "@/services/api/commonInterceptors/AxiosResponseInterceptors";
import PluteoJSServerAxiosRequestInterceptors from "@/services/api/PluteoJS/axiosConfig/PluteoJSServerAxiosRequestInterceptors";
import PluteoJSServerAxiosResponseInterceptors from "@/services/api/PluteoJS/axiosConfig/PluteoJSServerAxiosResponseInterceptors";

import {axiosRequestConfig} from "./AxiosServiceConstants";

/**
 * Creating axios instance for handling api service requests with
 * apiServerConfig.
 *
 * For updating any of the request configuration or for reviewing
 * the current configuration, please refer AxiosServiceConstants.axiosRequestConfig.
 */
const apiServer = axios.create(axiosRequestConfig);

// Register interceptors (no store dependency needed — interceptors are TODO stubs)
AxiosResponseInterceptors(null, apiServer);
PluteoJSServerAxiosRequestInterceptors(null, apiServer);
PluteoJSServerAxiosResponseInterceptors(null, apiServer);

export {apiServer};
