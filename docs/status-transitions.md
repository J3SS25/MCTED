# Allowed Status Transitions

### Tool Availability Status
`Available` → `Reserved` (upon reservation approval or active dates)  
`Available` / `Reserved` → `Borrowed` (upon handover checkout)  
`Borrowed` → `Returned` / `Available` (upon return inspection)  
`Available` / `Borrowed` → `Maintenance` / `Damaged` (upon defect report)  
`Maintenance` → `Available` (upon completion of repair and return-to-service)  
Any → `Archived` (only when stock is completely returned and unreserved)

### Reservation Status
`Pending` → `Approved` (staff decision)  
`Pending` → `Rejected` (staff decision)  
`Pending` / `Approved` → `Cancelled` (borrower cancellation)  
`Approved` → `Completed` (upon equipment checkout)

### Rental Status
`Borrowed` → `Returned` (staff inspection and acceptance)  
`Returned` → `Completed` (all fees and penalties cleared)

### Payment Status
`Pending` → `Paid` (staff verification)  
`Pending` → `Failed` (invalid reference or payment declined)  
`Paid` → `Refunded` (deposit or cancellation refund)

