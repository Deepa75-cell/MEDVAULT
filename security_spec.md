# MediVault Security Specification

## Data Invariants
1. A Medical Record must always be linked to a valid Patient UID.
2. A Share can only be created by the Record's owner.
3. A Doctor can only view a specific Record if an active Share exists for them.
4. Users cannot change their Role after registration.

## The "Dirty Dozen" Payloads (Denial Tests)
1. Creating a record for another patient.
2. Updating a record's patientId to steal it.
3. Creating a share for a record you don't own.
4. Accessing a record without being the owner or having a share.
5. Registering as a patient but then updating role to 'doctor'.
6. Injecting a massive string as a record title to cause resource exhaustion.
7. Deleting a record you didn't create.
8. Listing all records in the database (blanket read).
9. Spoofing doctorId in a share.
10. Modifying analysis results created by the system.
11. Bypassing the isValidId check with special characters.
12. Accessing user profiles without being signed in.

## Test Verification
- All above payloads result in `PERMISSION_DENIED` due to the Master Gate pattern in `firestore.rules`.
