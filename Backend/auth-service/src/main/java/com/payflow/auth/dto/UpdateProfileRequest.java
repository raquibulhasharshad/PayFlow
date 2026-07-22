package com.payflow.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String fullName;
    private String email;
    private String mobileNumber;
    
    // Password change fields
    private String currentPassword;
    private String newPassword;
    private String confirmNewPassword;
    
    // PIN change fields
    private String currentTransactionPin;
    private String newTransactionPin;
    private String confirmNewTransactionPin;
}
