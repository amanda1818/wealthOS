// Re-exports the app's single bottom-sheet primitive (components/BottomSheet.tsx,
// established in the Phase 2 de-modal pass) under ui/ so new route code has one
// place to import shared primitives from, without a second sheet implementation.
export { default } from '../components/BottomSheet';
