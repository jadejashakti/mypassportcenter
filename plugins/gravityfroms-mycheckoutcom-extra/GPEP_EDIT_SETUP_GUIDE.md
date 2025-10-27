# GP Easy Passthrough Edit Functionality Setup Guide

## Prerequisites

1. **Gravity Forms** plugin installed and activated
2. **GP Easy Passthrough** plugin installed and activated
3. **Original forms** with payment processing working correctly

## Step-by-Step Setup

### Step 1: Create Duplicate Forms

For each original form that needs edit functionality:

1. **Go to:** WordPress Admin → Forms
2. **Find your original form** (e.g., Form 1 - New Passport)
3. **Hover over form** → Click "Duplicate"
4. **Rename duplicate** (e.g., "Edit New Passport Form")
5. **Note the new form ID** (e.g., Form 11)

**Repeat for all forms:**
- Original Form 1 → Duplicate Form 11
- Original Form 4 → Duplicate Form 14
- Original Form 5 → Duplicate Form 15
- Original Form 6 → Duplicate Form 16

### Step 2: Clean Up Duplicate Forms

For each duplicate form:

1. **Go to:** Form Settings → Confirmations
2. **Delete or disable** all confirmations

3. **Go to:** Form Settings → Notifications  
4. **Delete or disable** all notifications

5. **Go to:** Form Settings → [Payment Gateway Name]
6. **Delete or disable** all payment feeds

7. **Go to:** Form Settings → Other Add-ons
8. **Delete or disable** feeds you don't want to run on edit

**Keep only:**
- Easy Passthrough feed (will be created in next step)
- Any feeds needed for PDF generation/email sending

### Step 3: Set Up Easy Passthrough Feeds

For each duplicate form:

1. **Go to:** Form Settings → Easy Passthrough
2. **Click:** "Add New"
3. **Source Form:** Select original form (e.g., Form 1)
4. **Field Mapping:** Map all fields from original → duplicate
   - Name → Name
   - Email → Email  
   - Phone → Phone
   - etc.
5. **Save Feed**

### Step 4: Create Edit Pages

Create WordPress pages for each edit form:

1. **Go to:** Pages → Add New
2. **Page Title:** "Edit New Passport" 
3. **Page Slug:** `edit-new-passport`
4. **Page Content:** 
   ```
   [gravityform id="11" title="false" description="false"]
   ```
5. **Publish**

**Create pages for all forms:**
- `/edit-new-passport/` → Form 11
- `/edit-lost-stolen-passport/` → Form 14
- `/edit-passport-renewal/` → Form 15
- `/edit-passport-corrections/` → Form 16

### Step 5: Update Configuration

1. **Open:** `gpep-edit-entry.php`
2. **Update form IDs** in the configuration:
   ```php
   $edit_forms = array(
       11, // Your actual duplicate form ID
       14, // Your actual duplicate form ID
       15, // Your actual duplicate form ID
       16, // Your actual duplicate form ID
   );
   ```

3. **Update field restrictions** if needed:
   ```php
   if ( ! in_array( $form['id'], array( 11, 14, 15, 16 ) ) ) {
   ```

### Step 6: Update URL Configuration

1. **Open:** `class-brevo-data.php`
2. **Update edit page URLs:**
   ```php
   $edit_pages = array(
       '1' => '/edit-new-passport/',
       '4' => '/edit-lost-stolen-passport/', 
       '5' => '/edit-passport-renewal/',
       '6' => '/edit-passport-corrections/',
   );
   ```

3. **Open:** `class-resend-email.php`
4. **Update with same URLs** as above

## Configuration Summary

| Component | Original Forms | Duplicate Forms | Edit Pages |
|-----------|---------------|-----------------|------------|
| **Form IDs** | 1, 4, 5, 6 | 11, 14, 15, 16 | N/A |
| **Payment Processing** | ✅ Yes | ❌ No | N/A |
| **Easy Passthrough Feed** | ❌ No | ✅ Yes | N/A |
| **GPEP Edit Entry** | ❌ No | ✅ Yes | N/A |
| **Page URLs** | N/A | N/A | `/edit-*/` |

## Testing

1. **Submit original form** → Receive confirmation email
2. **Click edit link** → Should open edit page with pre-filled data
3. **Make changes** → Submit form
4. **Check original entry** → Should be updated (no new entry created)
5. **Check email** → Should receive updated PDF

## Troubleshooting

### Form Not Pre-filling
- Check GP Easy Passthrough feed is configured correctly
- Verify field mapping is complete
- Check URL has `gpep_token` parameter

### New Entry Created Instead of Update
- Verify GPEP Edit Entry is configured with duplicate form IDs
- Check debug.log for error messages
- Ensure GP Easy Passthrough plugin is active

### Email/Product Fields Not Restricted
- Check form IDs in field restriction code
- Verify `gpep_token` is present in URL
- Check CSS is loading correctly

## File Locations

- **Main Configuration:** `gpep-edit-entry.php`
- **Email URLs:** `class-brevo-data.php` and `class-resend-email.php`
- **Setup Guide:** `GPEP_EDIT_SETUP_GUIDE.md`
- **How It Works:** `GPEP_EDIT_HOW_IT_WORKS.md`
