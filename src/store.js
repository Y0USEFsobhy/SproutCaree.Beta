// src/app/store.ts
import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector } from "react-redux"
import authReducer from "./features/auth/authSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer
    // add more slices later (children, attendance, ...)
  }
})

// Typed hooks: use these in components instead of plain useDispatch/useSelector
export const useAppDispatch = useDispatch
export const useAppSelector = useSelector
