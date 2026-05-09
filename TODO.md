# TODO - Ultimate POS (Postman Collection Driven)

## Step 1 - API Client extension
- [x] Add tenant/subscription APIs
- [ ] Add raw-materials APIs (CRUD + low/out-of-stock + stock adjust)
- [ ] Add product-recipes APIs (get by inventory_id, add/update/delete, set batch)
- [ ] Add product availability APIs (availability + can-produce)
- [ ] Add transactions APIs (list/get/cancel/refund) + sales today report
- [ ] Add guest order get (optional)

## Step 2 - UI core pages
- [x] Create RawMaterialManagement.tsx (CRUD + adjust + low/out-of-stock)
- [ ] Create ProductRecipeManagement.tsx (choose product, manage materials)

## Step 3 - Remaining UI
- [ ] Create ProductAvailability.tsx
- [ ] Create TransactionManagement.tsx
- [ ] Create TenantManagement.tsx + SubscriptionManagement.tsx (SUPER_ADMIN)

## Step 4 - Navigation
- [ ] Update DashboardLayout navigation + routes in App.tsx
- [ ] Add role-based visibility

## Step 5 - Types
- [ ] Extend src/types/index.ts with types for new entities

## Step 6 - Test
- [ ] Run lint
- [ ] Run dev and smoke-test flows

