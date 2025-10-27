# How GP Easy Passthrough Edit Functionality Works

## Overview

This system allows users to edit their form submissions without creating new entries or triggering payment processing. It uses GP Easy Passthrough to populate edit forms with existing data and custom code to update original entries.

## Technical Architecture

### Components

1. **Original Forms (1, 4, 5, 6)** - Handle new submissions with payment
2. **Duplicate Forms (11, 14, 15, 16)** - Handle edits without payment
3. **GP Easy Passthrough** - Populates edit forms with original data
4. **GPEP Edit Entry** - Updates existing entries instead of creating new ones
5. **Edit Pages** - WordPress pages containing duplicate forms

## Complete User Flow

### 1. Initial Submission Flow

```
User fills Form 1 → Payment → Entry created → PDF generated → Email sent
                                                                    ↓
                                            Email contains: EDIT_APP_LNK with gpep_token
```

### 2. Edit Flow

```
User clicks edit link → WordPress loads edit page → GP Easy Passthrough detects token
                                    ↓
                        Loads original entry data → Pre-fills Form 11
                                    ↓
                        User makes changes → Submits Form 11
                                    ↓
                        GPEP Edit Entry intercepts → Updates original entry (Form 1)
                                    ↓
                        PDF regenerated → Email sent → Success message
```

## Technical Implementation Details

### Token Generation

```php
// When email is sent (payment completion or resend)
$token = gp_easy_passthrough()->get_entry_token( $entry_id );
$edit_url = home_url( '/edit-new-passport/?gpep_token=' . $token );
```

### Form Population

```php
// GP Easy Passthrough feed configuration
Source Form: Form 1 (original)
Target Form: Form 11 (duplicate)
Field Mapping: All fields mapped 1:1
```

### Entry Update Process

```php
// GPEP Edit Entry hooks
add_filter( "gform_entry_id_pre_save_lead_{$form_id}", 'update_entry_id' );

// Instead of creating new entry, returns original entry ID
return $original_entry_id; // Updates existing entry
```

### Field Restrictions

```php
// Email fields made read-only
if ( $field->type === 'email' ) {
    $field->cssClass .= ' gf-readonly';
    $field->placeholder = 'Email cannot be changed';
}

// Product fields hidden
if ( in_array( $field->type, array( 'product', 'option' ) ) ) {
    $field->visibility = 'administrative';
}
```

## Security Features

### Token Security
- **Unique tokens** generated for each entry
- **Time-based expiry** (configurable)
- **One-time use** (optional)
- **Entry-specific** - tokens only work for their associated entry

### Access Control
- **No authentication required** - uses secure tokens instead
- **Email validation** - tokens tied to specific email addresses
- **Form restrictions** - edit forms can't process payments

## Data Flow Diagram

```
Original Entry (Form 1)
         ↓
    Token Generated
         ↓
    Edit URL Created
         ↓
    Email Sent to User
         ↓
    User Clicks Link
         ↓
    Edit Page Loads (Form 11)
         ↓
    GP Easy Passthrough Activates
         ↓
    Original Entry Data Loaded
         ↓
    Form 11 Pre-populated
         ↓
    User Makes Changes
         ↓
    Form 11 Submitted
         ↓
    GPEP Edit Entry Intercepts
         ↓
    Original Entry Updated
         ↓
    PDF Regenerated
         ↓
    Email Sent
```

## Database Operations

### Normal Submission (Form 1)
```sql
INSERT INTO wp_gf_entry (form_id, ...) VALUES (1, ...);
INSERT INTO wp_gf_entry_meta (entry_id, meta_key, meta_value) VALUES (...);
```

### Edit Submission (Form 11)
```sql
-- No new entry created
UPDATE wp_gf_entry SET field_1='new_value' WHERE id=original_entry_id;
UPDATE wp_gf_entry_meta SET meta_value='new_value' WHERE entry_id=original_entry_id;
```

## Integration Points

### Email System (Brevo)
```php
// Payment completion email
$params_base['EDIT_APP_LNK'] = $edit_url;

// Resend email  
$params['EDIT_APP_LNK'] = $edit_url;
```

### PDF Generation
```php
// After entry update
'process_feeds' => true, // Regenerates PDFs
```

### Conditional Logic
- **Preserved completely** - duplicate forms have same structure
- **Works identically** to original forms
- **No custom logic needed** - Gravity Forms handles everything

## Error Handling

### Invalid Token
```php
if ( ! $token_data ) {
    return '<p>This edit link has expired or is invalid.</p>';
}
```

### Missing Entry
```php
$entry = GFAPI::get_entry( $token_data['entry_id'] );
if ( is_wp_error( $entry ) ) {
    return '<p>Entry not found.</p>';
}
```

### Form Submission Errors
- **Validation errors** handled normally by Gravity Forms
- **Update failures** logged to debug.log
- **Fallback behavior** - shows error message to user

## Performance Considerations

### Caching
- **Token lookups** cached in GP Easy Passthrough sessions
- **Entry data** cached during form population
- **Form rendering** uses standard Gravity Forms caching

### Database Impact
- **No additional tables** - uses existing Gravity Forms structure
- **Minimal queries** - only updates existing entries
- **Efficient lookups** - indexed by entry ID and meta keys

## Maintenance

### Regular Tasks
- **Monitor debug.log** for errors
- **Check token expiry** settings
- **Verify edit page** functionality
- **Test email delivery** with edit links

### Updates
- **GP Easy Passthrough** updates handled automatically
- **Custom code** may need updates for Gravity Forms changes
- **Form structure changes** require field mapping updates

## Troubleshooting Guide

### Common Issues

1. **Form not pre-filling**
   - Check GP Easy Passthrough feed configuration
   - Verify token in URL
   - Check field mapping

2. **New entries created**
   - Verify GPEP Edit Entry form IDs
   - Check class instantiation
   - Review debug.log

3. **Email/Product fields editable**
   - Check form IDs in restriction code
   - Verify token detection
   - Check CSS loading

4. **PDF not regenerating**
   - Set `process_feeds => true`
   - Check PDF feed configuration
   - Verify feed is active
