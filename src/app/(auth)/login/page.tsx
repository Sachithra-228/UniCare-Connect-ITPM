"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useLanguage, type Language } from "@/context/language-context";
import { Button } from "@/components/shared/button";
import { Input } from "@/components/shared/input";
import { getDashboardPathForRole } from "@/lib/auth-redirect";
import { loginSchema, registerSchema, optionalUrlSchema, sriLankaPhoneSchema } from "@/lib/validation";
import { UserRole as AppUserRole } from "@/types";
import {
  OTHER_UNIVERSITY_VALUE,
  getDegreeProgramsForUniversity,
  isOtherSelection,
  localizeSignupOptionLabel
} from "@/lib/signup-data";
import { getRoleConfigs, type UserRole } from "@/lib/signup-role-config";
import { UniversityPicker } from "@/components/auth/university-picker";
import { RolePicker } from "@/components/auth/role-picker";
import { DegreePicker } from "@/components/auth/degree-picker";

type AuthMode = "signin" | "signup";

type SignUpData = {
  role: UserRole | "";
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  fieldA: string;
  fieldB: string;
  fieldC: string;
  fieldAOther: string;
  fieldBOther: string;
  acceptedTerms: boolean;
};

const INITIAL_SIGNUP_DATA: SignUpData = {
  role: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  fieldA: "",
  fieldB: "",
  fieldC: "",
  fieldAOther: "",
  fieldBOther: "",
  acceptedTerms: false
};

function resolveFieldA(data: SignUpData): string {
  if (data.fieldA === OTHER_UNIVERSITY_VALUE) return data.fieldAOther.trim();
  return data.fieldA.trim();
}
function resolveFieldB(data: SignUpData): string {
  if (isOtherSelection(data.fieldB)) return data.fieldBOther.trim();
  return data.fieldB.trim();
}

const AUTH_TEXT: Record<
  Language,
  {
    verifyEmailFirst: string;
    noAccountProfile: string;
    accountDeleted: string;
    accountBlocked: string;
    dbConnectionFailed: string;
    unableValidateStatus: string;
    incorrectEmailOrPassword: string;
    noAccountForEmail: string;
    incorrectPassword: string;
    tooManyLoginAttempts: string;
    networkIssue: string;
    invalidEmail: string;
    unableSignIn: string;
    accountCreationFailed: string;
    verificationEmailFailed: string;
    emailAlreadyInUse: string;
    strongerPassword: string;
    emailPasswordSignupDisabled: string;
    authMisconfigured: string;
    tooManyAttempts: string;
    unableCreateAccount: string;
    validEmailPasswordRequired: string;
    selectRoleContinue: string;
    fullNameRequired: string;
    atLeastTwoChars: string;
    emailRequired: string;
    passwordRequired: string;
    passwordAtLeast6: string;
    confirmPasswordRequired: string;
    passwordsMismatch: string;
    completeRequiredFixErrors: string;
    selectOrEnterUniversity: string;
    selectOrEnterDegree: string;
    enterField: (fieldLabel: string) => string;
    invalidUrl: string;
    invalidPhone: string;
    acceptTerms: string;
    accountCreatedSuccess: string;
    selectRole: string;
    rolePlaceholder: string;
    roleAria: string;
    fullName: string;
    yourFullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    min6Chars: string;
    reenterPassword: string;
    universityPlaceholder: string;
    universityAria: string;
    enterUniversityName: string;
    degreePlaceholder: string;
    degreeAria: string;
    enterDegreeProgram: string;
    pleaseSpecify: string;
    optionalLabel: string;
    reviewDetails: string;
    name: string;
    role: string;
    termsStatement: string;
    signInTab: string;
    signUpTab: string;
    welcomeBack: string;
    createUniCareAccount: string;
    signInSubtitle: string;
    signUpSubtitle: string;
    emailVerifiedSuccess: string;
    signInButton: string;
    signInWithGoogle: string;
    forgotPassword: string;
    createAccountLink: string;
    step: string;
    back: string;
    alreadyHaveAccount: string;
    continue: string;
    createAccountButton: string;
    accountCreatedTitle: string;
    ok: string;
  }
> = {
  en: {
    verifyEmailFirst: "Please verify your email first, then sign in.",
    noAccountProfile: "No account profile found. Please contact support.",
    accountDeleted: "This account has been deleted.",
    accountBlocked: "Your account is blocked. Please contact support.",
    dbConnectionFailed: "Database connection failed. Please try again in a minute.",
    unableValidateStatus: "Unable to validate account status right now. Please try again.",
    incorrectEmailOrPassword: "Incorrect email or password. Please try again.",
    noAccountForEmail: "No account found for this email.",
    incorrectPassword: "Incorrect password. Please try again.",
    tooManyLoginAttempts: "Too many login attempts. Please wait and try again.",
    networkIssue: "Network issue. Check your connection and try again.",
    invalidEmail: "Please enter a valid email address.",
    unableSignIn: "Unable to sign in. Please try again.",
    accountCreationFailed: "Account creation failed while saving your profile. Please try again.",
    verificationEmailFailed: "Your account was created, but verification email failed. Please try again.",
    emailAlreadyInUse: "An account with this email already exists. Sign in instead or use a different email.",
    strongerPassword: "Use a stronger password (at least 6 characters).",
    emailPasswordSignupDisabled: "Email/password sign-up is not enabled. Enable it in Firebase Console under Authentication -> Sign-in method.",
    authMisconfigured: "Authentication is misconfigured. Check your Firebase API key.",
    tooManyAttempts: "Too many attempts. Please try again later.",
    unableCreateAccount: "Unable to create account. Please try again.",
    validEmailPasswordRequired: "Please provide a valid email and password.",
    selectRoleContinue: "Please select your role to continue.",
    fullNameRequired: "Full name is required.",
    atLeastTwoChars: "Please enter at least 2 characters.",
    emailRequired: "Email is required.",
    passwordRequired: "Password is required.",
    passwordAtLeast6: "Password must be at least 6 characters.",
    confirmPasswordRequired: "Please confirm your password.",
    passwordsMismatch: "Passwords do not match.",
    completeRequiredFixErrors: "Please complete all required fields and fix any errors.",
    selectOrEnterUniversity: "Please select or enter your university.",
    selectOrEnterDegree: "Please select or enter your degree program.",
    enterField: (fieldLabel) => `Please enter ${fieldLabel.toLowerCase()}.`,
    invalidUrl: "Invalid URL.",
    invalidPhone: "Invalid phone number.",
    acceptTerms: "Please accept the terms to create your account.",
    accountCreatedSuccess:
      "Your account was created successfully. Please check your email and verify your account before signing in.",
    selectRole: "Select your role",
    rolePlaceholder: "Search or choose your role",
    roleAria: "Role",
    fullName: "Full name",
    yourFullName: "Your full name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    min6Chars: "Minimum 6 characters",
    reenterPassword: "Re-enter password",
    universityPlaceholder: "Search or choose your university",
    universityAria: "University",
    enterUniversityName: "Enter university name",
    degreePlaceholder: "Search or select degree program",
    degreeAria: "Degree program",
    enterDegreeProgram: "Enter degree program",
    pleaseSpecify: "Please specify",
    optionalLabel: "(Optional)",
    reviewDetails: "Review details",
    name: "Name",
    role: "Role",
    termsStatement: "I agree to UniCare Connect terms and understand this account is for verified support access.",
    signInTab: "Sign in",
    signUpTab: "Sign up",
    welcomeBack: "Welcome back to UniCare Connect",
    createUniCareAccount: "Create your UniCare account",
    signInSubtitle: "Sign in to continue your support journey.",
    signUpSubtitle: "Complete a simple 4-step setup based on your role.",
    emailVerifiedSuccess: "Email verified successfully. You can now sign in.",
    signInButton: "Sign in",
    signInWithGoogle: "Sign in with Google",
    forgotPassword: "Forgot password?",
    createAccountLink: "Create account",
    step: "Step",
    back: "Back",
    alreadyHaveAccount: "Already have an account?",
    continue: "Continue",
    createAccountButton: "Create account",
    accountCreatedTitle: "Account Created",
    ok: "OK"
  },
  si: {
    verifyEmailFirst: "à¶´à·…à¶¸à·”à·€ à¶”à¶¶à¶œà·š à¶Šà¶¸à·šà¶½à·Š à¶½à·’à¶´à·’à¶±à¶º à¶­à·„à·€à·”à¶»à·” à¶šà¶» à¶´à·’à·€à·’à·ƒà·™à¶±à·Šà¶±.",
    noAccountProfile: "à¶œà·’à¶«à·”à¶¸à·Š à¶´à·à¶­à·’à¶šà¶©à¶šà·Š à·„à¶¸à·” à¶±à·œà·€à·“à¶º. à·ƒà·„à·à¶º à¶…à¶¸à¶­à¶±à·Šà¶±.",
    accountDeleted: "à¶¸à·™à¶¸ à¶œà·’à¶«à·”à¶¸ à¶¸à¶šà· à¶¯à¶¸à· à¶‡à¶­.",
    accountBlocked: "à¶”à¶¶à¶œà·š à¶œà·’à¶«à·”à¶¸ à¶…à·€à·„à·’à¶» à¶šà¶» à¶‡à¶­. à·ƒà·„à·à¶º à¶…à¶¸à¶­à¶±à·Šà¶±.",
    dbConnectionFailed: "à¶¯à¶­à·Šà¶­ à·ƒà¶¸à·”à¶¯à· à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶°à¶­à·à·€à¶º à¶…à·ƒà¶¸à¶­à·Š à·€à·’à¶º. à¶¸à·’à¶±à·’à¶­à·Šà¶­à·”à·€à¶šà·’à¶±à·Š à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    unableValidateStatus: "à¶¯à·à¶±à¶§ à¶œà·’à¶«à·”à¶¸à·Š à¶­à¶­à·Šà¶­à·Šà·€à¶º à¶­à·„à·€à·”à¶»à·” à¶šà·… à¶±à·œà·„à·à¶š. à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    incorrectEmailOrPassword: "à¶Šà¶¸à·šà¶½à·Š à·„à· à¶¸à·”à¶»à¶´à¶¯à¶º à·€à·à¶»à¶¯à·’à¶ºà·’. à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    noAccountForEmail: "à¶¸à·™à¶¸ à¶Šà¶¸à·šà¶½à·Š à·ƒà¶³à·„à· à¶œà·’à¶«à·”à¶¸à¶šà·Š à¶±à·œà¶¸à·à¶­.",
    incorrectPassword: "à¶¸à·”à¶»à¶´à¶¯à¶º à·€à·à¶»à¶¯à·’à¶ºà·’. à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    tooManyLoginAttempts: "à¶´à·Šâ€à¶»à·€à·šà· à¶‹à¶­à·Šà·ƒà·à·„à¶ºà¶±à·Š à·€à·à¶©à·’à¶ºà·’. à¶§à·’à¶šà¶šà·Š à¶»à·à¶³à·“ à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    networkIssue: "à¶¢à·à¶½ à¶œà·à¶§à·…à·”à·€à¶šà·Š à¶‡à¶­. à·ƒà¶¸à·Šà¶¶à¶±à·Šà¶°à¶­à·à·€à¶º à¶´à¶»à·“à¶šà·Šà·‚à· à¶šà¶» à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    invalidEmail: "à¶šà¶»à·”à¶«à·à¶šà¶» à·€à¶½à¶‚à¶œà·” à¶Šà¶¸à·šà¶½à·Š à¶½à·’à¶´à·’à¶±à¶ºà¶šà·Š à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±.",
    unableSignIn: "à¶´à·’à·€à·’à·ƒà·“à¶¸à¶§ à¶±à·œà·„à·à¶šà·’ à·€à·’à¶º. à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    accountCreationFailed: "à¶”à¶¶à¶œà·š à¶´à·à¶­à·’à¶šà¶© à·ƒà·”à¶»à¶šà·’à¶± à¶…à¶­à¶»à¶­à·”à¶» à¶œà·’à¶«à·”à¶¸à·Š à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶…à·ƒà¶¸à¶­à·Š à·€à·’à¶º. à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    verificationEmailFailed: "à¶œà·’à¶«à·”à¶¸ à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶šà·…à·šà¶º, à¶±à¶¸à·”à¶­à·Š à¶­à·„à·€à·”à¶»à·” à¶šà·’à¶»à·“à¶¸à·š à¶Šà¶¸à·šà¶½à·Š à¶ºà·à·€à·“à¶¸ à¶…à·ƒà¶¸à¶­à·Š à·€à·’à¶º. à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    emailAlreadyInUse: "à¶¸à·™à¶¸ à¶Šà¶¸à·šà¶½à·Š à·ƒà¶¸à¶Ÿ à¶œà·’à¶«à·”à¶¸à¶šà·Š à¶¯à·à¶±à¶§à¶¸à¶­à·Š à¶‡à¶­. à¶´à·’à·€à·’à·ƒà·™à¶±à·Šà¶± à·„à· à·€à·™à¶±à¶­à·Š à¶Šà¶¸à·šà¶½à·Š à¶·à·à·€à·’à¶­à· à¶šà¶»à¶±à·Šà¶±.",
    strongerPassword: "à·€à¶©à· à·à¶šà·Šà¶­à·’à¶¸à¶­à·Š à¶¸à·”à¶»à¶´à¶¯à¶ºà¶šà·Š à¶·à·à·€à·’à¶­à· à¶šà¶»à¶±à·Šà¶± (à¶…à·€à¶¸ à¶…à¶šà·Šà·‚à¶» 6à¶šà·Š).",
    emailPasswordSignupDisabled: "Email/password à¶½à·’à¶ºà·à¶´à¶¯à·’à¶‚à¶ à·’à¶º à·ƒà¶šà·Šâ€à¶»à·“à¶º à¶šà¶» à¶±à·à¶­. Firebase Console à·„à·’ Authentication -> Sign-in method à¶ºà¶§à¶­à·š à·ƒà¶šà·Šâ€à¶»à·“à¶º à¶šà¶»à¶±à·Šà¶±.",
    authMisconfigured: "Authentication à·ƒà·à¶šà·ƒà·”à¶¸ à·€à·à¶»à¶¯à·’à¶ºà·’. Firebase API key à¶´à¶»à·“à¶šà·Šà·‚à· à¶šà¶»à¶±à·Šà¶±.",
    tooManyAttempts: "à¶‹à¶­à·Šà·ƒà·à·„à¶ºà¶±à·Š à·€à·à¶©à·’à¶ºà·’. à¶´à·ƒà·”à·€ à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    unableCreateAccount: "à¶œà·’à¶«à·”à¶¸ à·ƒà·‘à¶¯à·“à¶¸à¶§ à¶±à·œà·„à·à¶šà·’ à·€à·’à¶º. à¶±à·à·€à¶­ à¶‹à¶­à·Šà·ƒà·à·„ à¶šà¶»à¶±à·Šà¶±.",
    validEmailPasswordRequired: "à¶šà¶»à·”à¶«à·à¶šà¶» à·€à¶½à¶‚à¶œà·” à¶Šà¶¸à·šà¶½à·Š à·ƒà·„ à¶¸à·”à¶»à¶´à¶¯à¶ºà¶šà·Š à¶½à¶¶à· à¶¯à·™à¶±à·Šà¶±.",
    selectRoleContinue: "à¶‰à¶¯à·’à¶»à·’à¶ºà¶§ à¶ºà·à¶¸à¶§ à¶”à¶¶à¶œà·š à¶·à·–à¶¸à·’à¶šà·à·€ à¶­à·à¶»à¶±à·Šà¶±.",
    fullNameRequired: "à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶« à¶±à¶¸ à¶…à¶±à·’à·€à·à¶»à·Šà¶ºà¶ºà·’.",
    atLeastTwoChars: "à¶…à·€à¶¸ à·€à·à¶ºà·™à¶±à·Š à¶…à¶šà·Šà·‚à¶» 2à¶šà·Š à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±.",
    emailRequired: "à¶Šà¶¸à·šà¶½à·Š à¶…à¶±à·’à·€à·à¶»à·Šà¶ºà¶ºà·’.",
    passwordRequired: "à¶¸à·”à¶»à¶´à¶¯à¶º à¶…à¶±à·’à·€à·à¶»à·Šà¶ºà¶ºà·’.",
    passwordAtLeast6: "à¶¸à·”à¶»à¶´à¶¯à¶º à¶…à·€à¶¸ à·€à·à¶ºà·™à¶±à·Š à¶…à¶šà·Šà·‚à¶» 6à¶šà·Š à·€à·’à¶º à¶ºà·”à¶­à·”à¶º.",
    confirmPasswordRequired: "à¶šà¶»à·”à¶«à·à¶šà¶» à¶¸à·”à¶»à¶´à¶¯à¶º à¶­à·„à·€à·”à¶»à·” à¶šà¶»à¶±à·Šà¶±.",
    passwordsMismatch: "à¶¸à·”à¶»à¶´à¶¯ à¶œà·à·…à¶´à·™à¶±à·Šà¶±à·š à¶±à·à¶­.",
    completeRequiredFixErrors: "à¶…à·€à·à·Šâ€à¶º à¶šà·Šà·‚à·šà¶­à·Šâ€à¶» à¶´à·”à¶»à·€à· à¶¯à·à·‚ à¶±à·’à·€à·à¶»à¶¯à·’ à¶šà¶»à¶±à·Šà¶±.",
    selectOrEnterUniversity: "à¶”à¶¶à¶œà·š à·€à·’à·à·Šà·€à·€à·’à¶¯à·Šâ€à¶ºà·à¶½à¶º à¶­à·à¶»à¶±à·Šà¶± à·„à· à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±.",
    selectOrEnterDegree: "à¶”à¶¶à¶œà·š à¶‹à¶´à·à¶°à·’ à·€à·à¶©à·ƒà¶§à·„à¶± à¶­à·à¶»à¶±à·Šà¶± à·„à· à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±.",
    enterField: (fieldLabel) => `${fieldLabel} à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±.`,
    invalidUrl: "à·€à¶½à¶‚à¶œà·” à¶±à·œà·€à¶± URL à¶‘à¶šà¶šà·’.",
    invalidPhone: "à·€à¶½à¶‚à¶œà·” à¶±à·œà·€à¶± à¶¯à·”à¶»à¶šà¶®à¶± à¶…à¶‚à¶šà¶º.",
    acceptTerms: "à¶œà·’à¶«à·”à¶¸ à·ƒà·‘à¶¯à·“à¶¸à¶§ à¶´à·™à¶» à¶šà·œà¶±à·Šà¶¯à·šà·ƒà·’ à¶´à·’à·…à·’à¶œà¶±à·Šà¶±.",
    accountCreatedSuccess: "à¶”à¶¶à¶œà·š à¶œà·’à¶«à·”à¶¸ à·ƒà·à¶»à·Šà¶®à¶šà·€ à·ƒà·‘à¶¯à·’à¶«à·’. à¶´à·’à·€à·’à·ƒà·“à¶¸à¶§ à¶´à·™à¶» à¶Šà¶¸à·šà¶½à·Š à¶­à·„à·€à·”à¶»à·” à¶šà·’à¶»à·“à¶¸ à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶« à¶šà¶»à¶±à·Šà¶±.",
    selectRole: "à¶”à¶¶à¶œà·š à¶·à·–à¶¸à·’à¶šà·à·€ à¶­à·à¶»à¶±à·Šà¶±",
    rolePlaceholder: "à¶”à¶¶à¶œà·š à¶·à·–à¶¸à·’à¶šà·à·€ à·ƒà·œà¶ºà¶±à·Šà¶± à·„à· à¶­à·à¶»à¶±à·Šà¶±",
    roleAria: "à¶·à·–à¶¸à·’à¶šà·à·€",
    fullName: "à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶« à¶±à¶¸",
    yourFullName: "à¶”à¶¶à¶œà·š à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶« à¶±à¶¸",
    email: "à¶Šà¶¸à·šà¶½à·Š",
    password: "à¶¸à·”à¶»à¶´à¶¯à¶º",
    confirmPassword: "à¶¸à·”à¶»à¶´à¶¯à¶º à¶­à·„à·€à·”à¶»à·” à¶šà¶»à¶±à·Šà¶±",
    min6Chars: "à¶…à·€à¶¸ à¶…à¶šà·Šà·‚à¶» 6à¶šà·Š",
    reenterPassword: "à¶¸à·”à¶»à¶´à¶¯à¶º à¶±à·à·€à¶­ à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±",
    universityPlaceholder: "à¶”à¶¶à¶œà·š à·€à·’à·à·Šà·€à·€à·’à¶¯à·Šâ€à¶ºà·à¶½à¶º à·ƒà·œà¶ºà¶±à·Šà¶± à·„à· à¶­à·à¶»à¶±à·Šà¶±",
    universityAria: "à·€à·’à·à·Šà·€à·€à·’à¶¯à·Šâ€à¶ºà·à¶½à¶º",
    enterUniversityName: "à·€à·’à·à·Šà·€à·€à·’à¶¯à·Šâ€à¶ºà·à¶½ à¶±à¶¸ à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±",
    degreePlaceholder: "à¶‹à¶´à·à¶°à·’ à·€à·à¶©à·ƒà¶§à·„à¶± à·ƒà·œà¶ºà¶±à·Šà¶± à·„à· à¶­à·à¶»à¶±à·Šà¶±",
    degreeAria: "à¶‹à¶´à·à¶°à·’ à·€à·à¶©à·ƒà¶§à·„à¶±",
    enterDegreeProgram: "à¶‹à¶´à·à¶°à·’ à·€à·à¶©à·ƒà¶§à·„à¶± à¶‡à¶­à·”à·…à¶­à·Š à¶šà¶»à¶±à·Šà¶±",
    pleaseSpecify: "à·€à·’à·ƒà·Šà¶­à¶» à¶šà¶»à¶±à·Šà¶±",
    optionalLabel: "(à·€à·’à¶šà¶½à·Šà¶´)",
    reviewDetails: "à¶­à·œà¶»à¶­à·”à¶»à·” à·ƒà¶¸à·à¶½à·à¶ à¶±à¶º",
    name: "à¶±à¶¸",
    role: "à¶·à·–à¶¸à·’à¶šà·à·€",
    termsStatement: "à¶¸à¶¸ UniCare Connect à¶šà·œà¶±à·Šà¶¯à·šà·ƒà·’ à¶´à·’à·…à·’à¶œà¶±à·’à¶¸à·’ à·ƒà·„ à¶¸à·™à¶¸ à¶œà·’à¶«à·”à¶¸ à¶­à·„à·€à·”à¶»à·” à¶šà·… à·ƒà·„à¶º à¶´à·Šâ€à¶»à·€à·šà·à¶ºà¶§ à¶¶à·€ à¶…à·€à¶¶à·à¶° à¶šà¶»à¶¸à·’.",
    signInTab: "à¶´à·’à·€à·’à·ƒà·™à¶±à·Šà¶±",
    signUpTab: "à¶½à·’à¶ºà·à¶´à¶¯à·’à¶‚à¶ à·’ à·€à¶±à·Šà¶±",
    welcomeBack: "UniCare Connect à·€à·™à¶­ à¶±à·à·€à¶­ à·ƒà·à¶¯à¶»à¶ºà·™à¶±à·Š à¶´à·’à·…à·’à¶œà¶±à·’à¶¸à·”",
    createUniCareAccount: "à¶”à¶¶à¶œà·š UniCare à¶œà·’à¶«à·”à¶¸ à·ƒà·à¶¯à¶±à·Šà¶±",
    signInSubtitle: "à¶”à¶¶à¶œà·š à·ƒà·„à¶º à¶œà¶¸à¶± à¶‰à¶¯à·’à¶»à·’à¶ºà¶§ à¶œà·™à¶± à¶ºà·à¶¸à¶§ à¶´à·’à·€à·’à·ƒà·™à¶±à·Šà¶±.",
    signUpSubtitle: "à¶”à¶¶à¶œà·š à¶·à·–à¶¸à·’à¶šà·à·€ à¶…à¶±à·”à·€ à¶´à·’à¶ºà·€à¶» 4à¶š à·ƒà¶»à¶½ à·ƒà·à¶šà·ƒà·”à¶¸ à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶« à¶šà¶»à¶±à·Šà¶±.",
    emailVerifiedSuccess: "à¶Šà¶¸à·šà¶½à·Š à·ƒà·à¶»à·Šà¶®à¶šà·€ à¶­à·„à·€à·”à¶»à·” à·€à·’à¶º. à¶¯à·à¶±à·Š à¶”à¶¶à¶§ à¶´à·’à·€à·’à·ƒà·’à¶º à·„à·à¶š.",
    signInButton: "à¶´à·’à·€à·’à·ƒà·™à¶±à·Šà¶±",
    signInWithGoogle: "Google à¶¸à¶Ÿà·’à¶±à·Š à¶´à·’à·€à·’à·ƒà·™à¶±à·Šà¶±",
    forgotPassword: "à¶¸à·”à¶»à¶´à¶¯à¶º à¶…à¶¸à¶­à¶šà¶¯?",
    createAccountLink: "à¶œà·’à¶«à·”à¶¸ à·ƒà·à¶¯à¶±à·Šà¶±",
    step: "à¶´à·’à¶ºà·€à¶»",
    back: "à¶†à¶´à·ƒà·”",
    alreadyHaveAccount: "à¶¯à·à¶±à¶§à¶¸à¶­à·Š à¶œà·’à¶«à·”à¶¸à¶šà·Š à¶­à·’à¶¶à·šà¶¯?",
    continue: "à¶‰à¶¯à·’à¶»à·’à¶ºà¶§",
    createAccountButton: "à¶œà·’à¶«à·”à¶¸ à·ƒà·à¶¯à¶±à·Šà¶±",
    accountCreatedTitle: "à¶œà·’à¶«à·”à¶¸ à·ƒà·‘à¶¯à·’à¶«à·’",
    ok: "à·„à¶»à·’"
  },
  ta: {
    verifyEmailFirst: "à®®à¯à®¤à®²à®¿à®²à¯ à®‰à®™à¯à®•à®³à¯ à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯à®¤à¯à®¤à¯ à®ªà®¿à®©à¯à®©à®°à¯ à®‰à®³à¯à®¨à¯à®´à¯ˆà®¯à®µà¯à®®à¯.",
    noAccountProfile: "à®•à®£à®•à¯à®•à¯ à®šà¯à®¯à®µà®¿à®µà®°à®®à¯ à®•à®¿à®Ÿà¯ˆà®•à¯à®•à®µà®¿à®²à¯à®²à¯ˆ. à®†à®¤à®°à®µà¯ˆà®•à¯ à®¤à¯Šà®Ÿà®°à¯à®ªà¯ à®•à¯Šà®³à¯à®³à®µà¯à®®à¯.",
    accountDeleted: "à®‡à®¨à¯à®¤ à®•à®£à®•à¯à®•à¯ à®¨à¯€à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà¯à®³à¯à®³à®¤à¯.",
    accountBlocked: "à®‰à®™à¯à®•à®³à¯ à®•à®£à®•à¯à®•à¯ à®¤à®Ÿà¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà¯à®³à¯à®³à®¤à¯. à®†à®¤à®°à®µà¯ˆà®•à¯ à®¤à¯Šà®Ÿà®°à¯à®ªà¯ à®•à¯Šà®³à¯à®³à®µà¯à®®à¯.",
    dbConnectionFailed: "à®¤à®°à®µà¯à®¤à¯à®¤à®³ à®‡à®£à¯ˆà®ªà¯à®ªà¯ à®¤à¯‹à®²à¯à®µà®¿à®¯à®Ÿà¯ˆà®¨à¯à®¤à®¤à¯. à®’à®°à¯ à®¨à®¿à®®à®¿à®Ÿà®¤à¯à®¤à®¿à®²à¯ à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    unableValidateStatus: "à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®•à®£à®•à¯à®•à¯ à®¨à®¿à®²à¯ˆà®¯à¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®• à®®à¯à®Ÿà®¿à®¯à®µà®¿à®²à¯à®²à¯ˆ. à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    incorrectEmailOrPassword: "à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®…à®²à¯à®²à®¤à¯ à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯ à®¤à®µà®±à¯. à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    noAccountForEmail: "à®‡à®¨à¯à®¤ à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯à®•à¯à®•à¯ à®•à®£à®•à¯à®•à¯ à®‡à®²à¯à®²à¯ˆ.",
    incorrectPassword: "à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯ à®¤à®µà®±à¯. à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    tooManyLoginAttempts: "à®®à®¿à®• à®…à®¤à®¿à®• à®‰à®³à¯à®¨à¯à®´à¯ˆà®µà¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à®³à¯. à®šà®¿à®±à®¿à®¤à¯ à®¨à¯‡à®°à®®à¯ à®•à®¾à®¤à¯à®¤à®¿à®°à¯à®¨à¯à®¤à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    networkIssue: "à®¨à¯†à®Ÿà¯à®µà¯Šà®°à¯à®•à¯ à®šà®¿à®•à¯à®•à®²à¯. à®‡à®£à¯ˆà®ªà¯à®ªà¯ˆà®šà¯ à®šà®°à®¿à®ªà®¾à®°à¯à®¤à¯à®¤à¯ à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    invalidEmail: "à®šà®°à®¿à®¯à®¾à®© à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®®à¯à®•à®µà®°à®¿à®¯à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.",
    unableSignIn: "à®‰à®³à¯à®¨à¯à®´à¯ˆà®¯ à®®à¯à®Ÿà®¿à®¯à®µà®¿à®²à¯à®²à¯ˆ. à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    accountCreationFailed: "à®šà¯à®¯à®µà®¿à®µà®°à®¤à¯à®¤à¯ˆ à®šà¯‡à®®à®¿à®•à¯à®•à¯à®®à¯ à®ªà¯‹à®¤à¯ à®•à®£à®•à¯à®•à¯ à®‰à®°à¯à®µà®¾à®•à¯à®•à®®à¯ à®¤à¯‹à®²à¯à®µà®¿à®¯à®Ÿà¯ˆà®¨à¯à®¤à®¤à¯. à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    verificationEmailFailed: "à®•à®£à®•à¯à®•à¯ à®‰à®°à¯à®µà®¾à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯, à®†à®©à®¾à®²à¯ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯ à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®…à®©à¯à®ªà¯à®ªà®²à¯ à®¤à¯‹à®²à¯à®µà®¿à®¯à®Ÿà¯ˆà®¨à¯à®¤à®¤à¯. à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    emailAlreadyInUse: "à®‡à®¨à¯à®¤ à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯à®Ÿà®©à¯ à®à®±à¯à®•à®©à®µà¯‡ à®’à®°à¯ à®•à®£à®•à¯à®•à¯ à®‰à®³à¯à®³à®¤à¯. à®‰à®³à¯à®¨à¯à®´à¯ˆà®¯à®µà¯à®®à¯ à®…à®²à¯à®²à®¤à¯ à®µà¯‡à®±à¯ à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ˆà®ªà¯ à®ªà®¯à®©à¯à®ªà®Ÿà¯à®¤à¯à®¤à®µà¯à®®à¯.",
    strongerPassword: "à®µà®²à¯à®µà®¾à®© à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯à®²à¯ˆà®ªà¯ à®ªà®¯à®©à¯à®ªà®Ÿà¯à®¤à¯à®¤à®µà¯à®®à¯ (à®•à¯à®±à¯ˆà®¨à¯à®¤à®¤à¯ 6 à®Žà®´à¯à®¤à¯à®¤à¯à®•à®³à¯).",
    emailPasswordSignupDisabled: "Email/password à®ªà®¤à®¿à®µà¯ à®šà¯†à®¯à®²à¯à®ªà®Ÿà¯à®¤à¯à®¤à®ªà¯à®ªà®Ÿà®µà®¿à®²à¯à®²à¯ˆ. Firebase Console à®‡à®²à¯ Authentication -> Sign-in method à®ªà®•à¯à®¤à®¿à®¯à®¿à®²à¯ à®šà¯†à®¯à®²à¯à®ªà®Ÿà¯à®¤à¯à®¤à®µà¯à®®à¯.",
    authMisconfigured: "Authentication à®¤à®µà®±à®¾à®• à®…à®®à¯ˆà®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà¯à®³à¯à®³à®¤à¯. Firebase API key à® à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®µà¯à®®à¯.",
    tooManyAttempts: "à®®à®¿à®• à®…à®¤à®¿à®• à®®à¯à®¯à®±à¯à®šà®¿à®•à®³à¯. à®ªà®¿à®©à¯à®©à®°à¯ à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    unableCreateAccount: "à®•à®£à®•à¯à®•à¯ˆ à®‰à®°à¯à®µà®¾à®•à¯à®• à®®à¯à®Ÿà®¿à®¯à®µà®¿à®²à¯à®²à¯ˆ. à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®®à¯à®¯à®±à¯à®šà®¿à®•à¯à®•à®µà¯à®®à¯.",
    validEmailPasswordRequired: "à®šà®°à®¿à®¯à®¾à®© à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®®à®±à¯à®±à¯à®®à¯ à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯à®²à¯ˆ à®µà®´à®™à¯à®•à®µà¯à®®à¯.",
    selectRoleContinue: "à®¤à¯Šà®Ÿà®° à®‰à®™à¯à®•à®³à¯ à®ªà®™à¯à®•à¯ˆ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯.",
    fullNameRequired: "à®®à¯à®´à¯à®ªà¯à®ªà¯†à®¯à®°à¯ à®…à®µà®šà®¿à®¯à®®à¯.",
    atLeastTwoChars: "à®•à¯à®±à¯ˆà®¨à¯à®¤à®¤à¯ 2 à®Žà®´à¯à®¤à¯à®¤à¯à®•à®³à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.",
    emailRequired: "à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®…à®µà®šà®¿à®¯à®®à¯.",
    passwordRequired: "à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯ à®…à®µà®šà®¿à®¯à®®à¯.",
    passwordAtLeast6: "à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯ à®•à¯à®±à¯ˆà®¨à¯à®¤à®¤à¯ 6 à®Žà®´à¯à®¤à¯à®¤à¯à®•à®³à¯ à®‡à®°à¯à®•à¯à®• à®µà¯‡à®£à¯à®Ÿà¯à®®à¯.",
    confirmPasswordRequired: "à®¤à®¯à®µà¯à®šà¯†à®¯à¯à®¤à¯ à®‰à®™à¯à®•à®³à¯ à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯à®²à¯ˆ à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à®µà¯à®®à¯.",
    passwordsMismatch: "à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®±à¯à®•à®³à¯ à®ªà¯Šà®°à¯à®¨à¯à®¤à®µà®¿à®²à¯à®²à¯ˆ.",
    completeRequiredFixErrors: "à®¤à¯‡à®µà¯ˆà®¯à®¾à®© à®ªà¯à®²à®™à¯à®•à®³à¯ˆ à®ªà¯‚à®°à¯à®¤à¯à®¤à®¿ à®šà¯†à®¯à¯à®¤à¯ à®ªà®¿à®´à¯ˆà®•à®³à¯ˆà®šà¯ à®šà®°à®¿à®šà¯†à®¯à¯à®¯à®µà¯à®®à¯.",
    selectOrEnterUniversity: "à®‰à®™à¯à®•à®³à¯ à®ªà®²à¯à®•à®²à¯ˆà®•à¯à®•à®´à®•à®¤à¯à®¤à¯ˆ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯ à®…à®²à¯à®²à®¤à¯ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.",
    selectOrEnterDegree: "à®‰à®™à¯à®•à®³à¯ à®ªà®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà®¿à®ªà¯à®ªà¯ à®¤à®¿à®Ÿà¯à®Ÿà®¤à¯à®¤à¯ˆ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯ à®…à®²à¯à®²à®¤à¯ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.",
    enterField: (fieldLabel) => `${fieldLabel} à® à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯.`,
    invalidUrl: "à®¤à®µà®±à®¾à®© URL.",
    invalidPhone: "à®¤à®µà®±à®¾à®© à®¤à¯Šà®²à¯ˆà®ªà¯‡à®šà®¿ à®Žà®£à¯.",
    acceptTerms: "à®•à®£à®•à¯à®•à¯ˆ à®‰à®°à¯à®µà®¾à®•à¯à®• à®µà®¿à®¤à®¿à®®à¯à®±à¯ˆà®•à®³à¯ˆ à®à®±à¯à®•à®µà¯à®®à¯.",
    accountCreatedSuccess: "à®‰à®™à¯à®•à®³à¯ à®•à®£à®•à¯à®•à¯ à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®‰à®°à¯à®µà®¾à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯. à®‰à®³à¯à®¨à¯à®´à¯ˆà®µà®¤à®±à¯à®•à¯ à®®à¯à®©à¯ à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯ˆ à®®à¯à®Ÿà®¿à®•à¯à®•à®µà¯à®®à¯.",
    selectRole: "à®‰à®™à¯à®•à®³à¯ à®ªà®™à¯à®•à¯ˆ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯",
    rolePlaceholder: "à®‰à®™à¯à®•à®³à¯ à®ªà®™à¯à®•à¯ˆ à®¤à¯‡à®Ÿà®µà¯à®®à¯ à®…à®²à¯à®²à®¤à¯ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯",
    roleAria: "à®ªà®™à¯à®•à¯",
    fullName: "à®®à¯à®´à¯à®ªà¯à®ªà¯†à®¯à®°à¯",
    yourFullName: "à®‰à®™à¯à®•à®³à¯ à®®à¯à®´à¯à®ªà¯à®ªà¯†à®¯à®°à¯",
    email: "à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯",
    password: "à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯",
    confirmPassword: "à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯à®²à¯ˆ à®‰à®±à¯à®¤à®¿à®ªà¯à®ªà®Ÿà¯à®¤à¯à®¤à®µà¯à®®à¯",
    min6Chars: "à®•à¯à®±à¯ˆà®¨à¯à®¤à®¤à¯ 6 à®Žà®´à¯à®¤à¯à®¤à¯à®•à®³à¯",
    reenterPassword: "à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯à®²à¯ˆ à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯",
    universityPlaceholder: "à®‰à®™à¯à®•à®³à¯ à®ªà®²à¯à®•à®²à¯ˆà®•à¯à®•à®´à®•à®¤à¯à®¤à¯ˆ à®¤à¯‡à®Ÿà®µà¯à®®à¯ à®…à®²à¯à®²à®¤à¯ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯",
    universityAria: "à®ªà®²à¯à®•à®²à¯ˆà®•à¯à®•à®´à®•à®®à¯",
    enterUniversityName: "à®ªà®²à¯à®•à®²à¯ˆà®•à¯à®•à®´à®• à®ªà¯†à®¯à®°à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯",
    degreePlaceholder: "à®ªà®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà®¿à®ªà¯à®ªà¯ à®¤à®¿à®Ÿà¯à®Ÿà®¤à¯à®¤à¯ˆ à®¤à¯‡à®Ÿà®µà¯à®®à¯ à®…à®²à¯à®²à®¤à¯ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®µà¯à®®à¯",
    degreeAria: "à®ªà®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà®¿à®ªà¯à®ªà¯ à®¤à®¿à®Ÿà¯à®Ÿà®®à¯",
    enterDegreeProgram: "à®ªà®Ÿà¯à®Ÿà®ªà¯à®ªà®Ÿà®¿à®ªà¯à®ªà¯ à®¤à®¿à®Ÿà¯à®Ÿà®¤à¯à®¤à¯ˆ à®‰à®³à¯à®³à®¿à®Ÿà®µà¯à®®à¯",
    pleaseSpecify: "à®¤à®¯à®µà¯à®šà¯†à®¯à¯à®¤à¯ à®•à¯à®±à®¿à®ªà¯à®ªà®¿à®Ÿà®µà¯à®®à¯",
    optionalLabel: "(à®µà®¿à®°à¯à®ªà¯à®ªà®®à¯)",
    reviewDetails: "à®µà®¿à®µà®°à®™à¯à®•à®³à¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®µà¯à®®à¯",
    name: "à®ªà¯†à®¯à®°à¯",
    role: "à®ªà®™à¯à®•à¯",
    termsStatement: "UniCare Connect à®µà®¿à®¤à®¿à®®à¯à®±à¯ˆà®•à®³à¯ˆ à®à®±à¯à®•à®¿à®±à¯‡à®©à¯, à®®à¯‡à®²à¯à®®à¯ à®‡à®¨à¯à®¤ à®•à®£à®•à¯à®•à¯ à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿ à®†à®¤à®°à®µà¯ à®…à®£à¯à®•à®²à¯à®•à¯à®•à®¾à®©à®¤à¯ à®Žà®©à¯à®ªà®¤à¯ˆ à®ªà¯à®°à®¿à®¨à¯à®¤à¯à®•à¯Šà®³à¯à®•à®¿à®±à¯‡à®©à¯.",
    signInTab: "à®‰à®³à¯à®¨à¯à®´à¯ˆ",
    signUpTab: "à®ªà®¤à®¿à®µà¯ à®šà¯†à®¯à¯",
    welcomeBack: "UniCare Connect à®•à¯à®•à¯ à®®à¯€à®£à¯à®Ÿà¯à®®à¯ à®µà®°à®µà¯‡à®±à¯à®•à®¿à®±à¯‹à®®à¯",
    createUniCareAccount: "à®‰à®™à¯à®•à®³à¯ UniCare à®•à®£à®•à¯à®•à¯ˆ à®‰à®°à¯à®µà®¾à®•à¯à®•à®µà¯à®®à¯",
    signInSubtitle: "à®‰à®™à¯à®•à®³à¯ à®†à®¤à®°à®µà¯ à®ªà®¯à®£à®¤à¯à®¤à¯ˆ à®¤à¯Šà®Ÿà®° à®‰à®³à¯à®¨à¯à®´à¯ˆà®•.",
    signUpSubtitle: "à®‰à®™à¯à®•à®³à¯ à®ªà®™à¯à®•à¯ˆ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆà®¯à®¾à®•à®•à¯ à®•à¯Šà®£à¯à®Ÿ à®Žà®³à®¿à®¯ 4 à®ªà®Ÿà®¿ à®…à®®à¯ˆà®ªà¯à®ªà¯ˆ à®®à¯à®Ÿà®¿à®•à¯à®•à®µà¯à®®à¯.",
    emailVerifiedSuccess: "à®®à®¿à®©à¯à®©à®žà¯à®šà®²à¯ à®µà¯†à®±à¯à®±à®¿à®•à®°à®®à®¾à®• à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯. à®‡à®ªà¯à®ªà¯‹à®¤à¯ à®‰à®³à¯à®¨à¯à®´à¯ˆà®¯à®²à®¾à®®à¯.",
    signInButton: "à®‰à®³à¯à®¨à¯à®´à¯ˆ",
    signInWithGoogle: "Google à®®à¯‚à®²à®®à¯ à®‰à®³à¯à®¨à¯à®´à¯ˆ",
    forgotPassword: "à®•à®Ÿà®µà¯à®šà¯à®šà¯Šà®²à¯ à®®à®±à®¨à¯à®¤à¯à®µà®¿à®Ÿà¯à®Ÿà®¤à®¾?",
    createAccountLink: "à®•à®£à®•à¯à®•à¯ˆ à®‰à®°à¯à®µà®¾à®•à¯à®•à®µà¯à®®à¯",
    step: "à®ªà®Ÿà®¿",
    back: "à®ªà®¿à®©à¯à®©à¯à®•à¯à®•à¯",
    alreadyHaveAccount: "à®à®±à¯à®•à®©à®µà¯‡ à®•à®£à®•à¯à®•à¯ à®‰à®³à¯à®³à®¤à®¾?",
    continue: "à®¤à¯Šà®Ÿà®°à®µà¯à®®à¯",
    createAccountButton: "à®•à®£à®•à¯à®•à¯ˆ à®‰à®°à¯à®µà®¾à®•à¯à®•à®µà¯à®®à¯",
    accountCreatedTitle: "à®•à®£à®•à¯à®•à¯ à®‰à®°à¯à®µà®¾à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà®¤à¯",
    ok: "à®šà®°à®¿"
  }
};

AUTH_TEXT.si = {
  ...AUTH_TEXT.en,
  selectRoleContinue: "ඉදිරියට යාමට ඔබගේ භූමිකාව තෝරන්න.",
  selectRole: "ඔබගේ භූමිකාව තෝරන්න",
  rolePlaceholder: "ඔබගේ භූමිකාව සොයන්න හෝ තෝරන්න",
  roleAria: "භූමිකාව",
  fullName: "සම්පූර්ණ නම",
  yourFullName: "ඔබගේ සම්පූර්ණ නම",
  email: "ඊමේල්",
  password: "මුරපදය",
  confirmPassword: "මුරපදය තහවුරු කරන්න",
  min6Chars: "අවම අක්ෂර 6ක්",
  reenterPassword: "මුරපදය නැවත ඇතුළත් කරන්න",
  universityPlaceholder: "ඔබගේ විශ්වවිද්‍යාලය සොයන්න හෝ තෝරන්න",
  universityAria: "විශ්වවිද්‍යාලය",
  enterUniversityName: "විශ්වවිද්‍යාල නම ඇතුළත් කරන්න",
  degreePlaceholder: "උපාධි වැඩසටහන සොයන්න හෝ තෝරන්න",
  degreeAria: "උපාධි වැඩසටහන",
  enterDegreeProgram: "උපාධි වැඩසටහන ඇතුළත් කරන්න",
  pleaseSpecify: "විස්තර කරන්න",
  optionalLabel: "(විකල්ප)",
  reviewDetails: "තොරතුරු සමාලෝචනය",
  name: "නම",
  role: "භූමිකාව",
  termsStatement: "මම UniCare Connect කොන්දේසි පිළිගනිමි සහ මෙම ගිණුම තහවුරු කළ සහය ප්‍රවේශයට බව අවබෝධ කරමි.",
  signInTab: "පිවිසෙන්න",
  signUpTab: "ලියාපදිංචි වන්න",
  welcomeBack: "UniCare Connect වෙත නැවත සාදරයෙන් පිළිගනිමු",
  createUniCareAccount: "ඔබගේ UniCare ගිණුම සාදන්න",
  signInSubtitle: "ඔබගේ සහය ගමන ඉදිරියට ගෙන යාමට පිවිසෙන්න.",
  signUpSubtitle: "ඔබගේ භූමිකාව අනුව පියවර 4ක සරල සැකසුම සම්පූර්ණ කරන්න.",
  emailVerifiedSuccess: "ඊමේල් සාර්ථකව තහවුරු විය. දැන් ඔබට පිවිසිය හැක.",
  signInButton: "පිවිසෙන්න",
  signInWithGoogle: "Google මඟින් පිවිසෙන්න",
  forgotPassword: "මුරපදය අමතකද?",
  createAccountLink: "ගිණුම සාදන්න",
  step: "පියවර",
  back: "ආපසු",
  alreadyHaveAccount: "දැනටමත් ගිණුමක් තිබේද?",
  continue: "ඉදිරියට",
  createAccountButton: "ගිණුම සාදන්න",
  accountCreatedTitle: "ගිණුම සෑදිණි",
  ok: "හරි"
};

AUTH_TEXT.ta = {
  ...AUTH_TEXT.en,
  selectRoleContinue: "தொடர உங்கள் பங்கை தேர்ந்தெடுக்கவும்.",
  selectRole: "உங்கள் பங்கை தேர்ந்தெடுக்கவும்",
  rolePlaceholder: "உங்கள் பங்கை தேடவும் அல்லது தேர்ந்தெடுக்கவும்",
  roleAria: "பங்கு",
  fullName: "முழுப்பெயர்",
  yourFullName: "உங்கள் முழுப்பெயர்",
  email: "மின்னஞ்சல்",
  password: "கடவுச்சொல்",
  confirmPassword: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
  min6Chars: "குறைந்தது 6 எழுத்துகள்",
  reenterPassword: "கடவுச்சொல்லை மீண்டும் உள்ளிடவும்",
  universityPlaceholder: "உங்கள் பல்கலைக்கழகத்தை தேடவும் அல்லது தேர்ந்தெடுக்கவும்",
  universityAria: "பல்கலைக்கழகம்",
  enterUniversityName: "பல்கலைக்கழக பெயரை உள்ளிடவும்",
  degreePlaceholder: "பட்டப்படிப்பு திட்டத்தை தேடவும் அல்லது தேர்ந்தெடுக்கவும்",
  degreeAria: "பட்டப்படிப்பு திட்டம்",
  enterDegreeProgram: "பட்டப்படிப்பு திட்டத்தை உள்ளிடவும்",
  pleaseSpecify: "தயவுசெய்து குறிப்பிடவும்",
  optionalLabel: "(விருப்பம்)",
  reviewDetails: "விவரங்களை சரிபார்க்கவும்",
  name: "பெயர்",
  role: "பங்கு",
  termsStatement: "UniCare Connect விதிமுறைகளை ஏற்கிறேன், மேலும் இந்த கணக்கு சரிபார்க்கப்பட்ட ஆதரவு அணுகலுக்கானது என்பதை புரிந்துகொள்கிறேன்.",
  signInTab: "உள்நுழை",
  signUpTab: "பதிவு செய்",
  welcomeBack: "UniCare Connect க்கு மீண்டும் வரவேற்கிறோம்",
  createUniCareAccount: "உங்கள் UniCare கணக்கை உருவாக்கவும்",
  signInSubtitle: "உங்கள் ஆதரவு பயணத்தை தொடர உள்நுழைக.",
  signUpSubtitle: "உங்கள் பங்கை அடிப்படையாகக் கொண்ட எளிய 4 படி அமைப்பை முடிக்கவும்.",
  emailVerifiedSuccess: "மின்னஞ்சல் வெற்றிகரமாக சரிபார்க்கப்பட்டது. இப்போது உள்நுழையலாம்.",
  signInButton: "உள்நுழை",
  signInWithGoogle: "Google மூலம் உள்நுழை",
  forgotPassword: "கடவுச்சொல் மறந்துவிட்டதா?",
  createAccountLink: "கணக்கை உருவாக்கவும்",
  step: "படி",
  back: "பின்னுக்கு",
  alreadyHaveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
  continue: "தொடரவும்",
  createAccountButton: "கணக்கை உருவாக்கவும்",
  accountCreatedTitle: "கணக்கு உருவாக்கப்பட்டது",
  ok: "சரி"
};

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, registerWithEmail } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = AUTH_TEXT[language];
  const roleConfigs = getRoleConfigs(language);
  const defaultMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const isVerifiedRedirect = searchParams.get("verified") === "1";
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);
  const [signUpPopupMessage, setSignUpPopupMessage] = useState<string | null>(null);
  const [signUpStep, setSignUpStep] = useState(1);
  const [signUpData, setSignUpData] = useState<SignUpData>(INITIAL_SIGNUP_DATA);
  const [recentlyRegisteredEmail, setRecentlyRegisteredEmail] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ fieldA?: string; fieldB?: string; fieldC?: string }>({});
  const [step2Errors, setStep2Errors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const selectedRoleConfig = signUpData.role ? roleConfigs[signUpData.role] : null;
  const isStudent = signUpData.role === "student";
  const isUniversityRole = signUpData.role === "student" || signUpData.role === "admin";
  const degreePrograms = isStudent
    ? getDegreeProgramsForUniversity(
        signUpData.fieldA === OTHER_UNIVERSITY_VALUE ? "" : signUpData.fieldA
      )
    : [];

  const isDatabaseErrorMessage = (msg: string) =>
    /Mongo|MONGODB|connection|ECONNREFUSED|ETIMEDOUT|timed out|not configured/i.test(msg);

  const getReadableAuthError = (error: unknown) => {
    if (error instanceof Error && error.message === "EMAIL_NOT_VERIFIED") {
      return t.verifyEmailFirst;
    }
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return t.noAccountProfile;
    }
    if (error instanceof Error && error.message === "ACCOUNT_DELETED") {
      return t.accountDeleted;
    }
    if (error instanceof Error && error.message === "ACCOUNT_BLOCKED") {
      return t.accountBlocked;
    }
    if (error instanceof Error && error.message === "DB_CONNECTION_FAILED") {
      return t.dbConnectionFailed;
    }
    if (error instanceof Error && isDatabaseErrorMessage(error.message)) {
      return `${t.dbConnectionFailed} ${error.message}`;
    }
    if (error instanceof Error && error.message === "SIGNIN_PRECHECK_FAILED") {
      return t.unableValidateStatus;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
    ) {
      const code = (error as { code: string }).code;

      if (code === "auth/invalid-credential") {
        return t.incorrectEmailOrPassword;
      }
      if (code === "auth/user-not-found") {
        return t.noAccountForEmail;
      }
      if (code === "auth/wrong-password") {
        return t.incorrectPassword;
      }
      if (code === "auth/too-many-requests") {
        return t.tooManyLoginAttempts;
      }
      if (code === "auth/network-request-failed") {
        return t.networkIssue;
      }
      if (code === "auth/invalid-email") {
        return t.invalidEmail;
      }
    }

    return t.unableSignIn;
  };

  const getPostSignInPath = async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok) {
      return "/dashboard";
    }

    const data = (await response.json()) as {
      user?: { role?: string; needsProfileCompletion?: boolean };
    };
    if (data.user?.needsProfileCompletion) {
      return "/auth/complete-profile";
    }
    return getDashboardPathForRole(data.user?.role);
  };

  const getReadableSignUpError = (error: unknown) => {
    if (error instanceof Error && error.message === "ACCOUNT_SYNC_FAILED") {
      return t.accountCreationFailed;
    }
    if (error instanceof Error && error.message === "DB_CONNECTION_FAILED") {
      return t.dbConnectionFailed;
    }
    if (error instanceof Error && isDatabaseErrorMessage(error.message)) {
      return `${t.dbConnectionFailed} ${error.message}`;
    }
    if (error instanceof Error && error.message === "VERIFICATION_EMAIL_SEND_FAILED") {
      return t.verificationEmailFailed;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code?: unknown }).code === "string"
    ) {
      const code = (error as { code: string }).code;

      if (code === "auth/email-already-in-use") {
        return t.emailAlreadyInUse;
      }
      if (code === "auth/invalid-email") {
        return t.invalidEmail;
      }
      if (code === "auth/weak-password") {
        return t.strongerPassword;
      }
      if (code === "auth/network-request-failed") {
        return t.networkIssue;
      }
      if (code === "auth/operation-not-allowed") {
        return t.emailPasswordSignupDisabled;
      }
      if (code === "auth/invalid-api-key" || code === "auth/api-key-not-valid") {
        return t.authMisconfigured;
      }
      if (code === "auth/too-many-requests") {
        return t.tooManyAttempts;
      }
    }

    return t.unableCreateAccount;
  };

  const handleSignInSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignInError(null);

    const data = new FormData(event.currentTarget);
    const values = {
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? "")
    };

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      setSignInError(t.validEmailPasswordRequired);
      return;
    }

    try {
      await signInWithEmail(result.data.email, result.data.password);
      const nextPath = await getPostSignInPath();
      router.push(nextPath);
    } catch (error) {
      setSignInError(getReadableAuthError(error));
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInError(null);
    try {
      await signInWithGoogle();
      const nextPath = await getPostSignInPath();
      router.push(nextPath);
    } catch (error) {
      setSignInError(getReadableAuthError(error));
    }
  };

  const updateSignUpField = (field: keyof SignUpData, value: string | boolean) => {
    setSignUpData((previous) => ({ ...previous, [field]: value }));
  };

  const validateSignUpStep = (step: number): string | null => {
    setFieldErrors({});
    if (step === 1) {
      if (!signUpData.role) return t.selectRoleContinue;
      return null;
    }

    if (step === 2) {
      setStep2Errors({});
      const err: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
      if (!signUpData.name.trim()) err.name = t.fullNameRequired;
      else if (signUpData.name.trim().length < 2) err.name = t.atLeastTwoChars;
      const emailResult = registerSchema.shape.email.safeParse(signUpData.email);
      if (!signUpData.email.trim()) err.email = t.emailRequired;
      else if (!emailResult.success) err.email = t.invalidEmail;
      if (!signUpData.password) err.password = t.passwordRequired;
      else if (signUpData.password.length < 6) err.password = t.passwordAtLeast6;
      if (!signUpData.confirmPassword) err.confirmPassword = t.confirmPasswordRequired;
      else if (signUpData.password !== signUpData.confirmPassword)
        err.confirmPassword = t.passwordsMismatch;
      if (Object.keys(err).length > 0) {
        setStep2Errors(err);
        return t.completeRequiredFixErrors;
      }
      return null;
    }

    if (step === 3 && selectedRoleConfig) {
      const a = resolveFieldA(signUpData);
      const b = resolveFieldB(signUpData);
      const c = signUpData.fieldC.trim();
      const err: { fieldA?: string; fieldB?: string; fieldC?: string } = {};

      if (!a) {
        err.fieldA =
          selectedRoleConfig.field1Kind === "university"
            ? t.selectOrEnterUniversity
            : t.enterField(selectedRoleConfig.fields[0].label.replace(" (Optional)", ""));
      }
      if (!b) {
        err.fieldB =
          selectedRoleConfig.field2Kind === "degree"
            ? t.selectOrEnterDegree
            : t.enterField(selectedRoleConfig.fields[1].label.replace(" (Optional)", ""));
      }

      const field3Optional = selectedRoleConfig.fields[2].optional;
      if (!field3Optional && !c) {
        err.fieldC = t.enterField(selectedRoleConfig.fields[2].label.replace(" (Optional)", ""));
      } else if (c) {
        if (selectedRoleConfig.fields[2].type === "url") {
          const urlResult = optionalUrlSchema.safeParse(c);
          if (!urlResult.success) err.fieldC = urlResult.error.errors[0]?.message ?? t.invalidUrl;
        } else if (selectedRoleConfig.fields[2].type === "tel") {
          const phoneResult = sriLankaPhoneSchema.safeParse(c);
          if (!phoneResult.success) err.fieldC = phoneResult.error.errors[0]?.message ?? t.invalidPhone;
        }
      }

      if (Object.keys(err).length > 0) {
        setFieldErrors(err);
        return t.completeRequiredFixErrors;
      }
      return null;
    }

    if (!signUpData.acceptedTerms) {
      return t.acceptTerms;
    }
    return null;
  };

  const goToNextSignUpStep = () => {
    setSignUpError(null);
    const error = validateSignUpStep(signUpStep);
    if (error) {
      setSignUpError(error);
      return;
    }

    setSignUpStep((previous) => Math.min(4, previous + 1));
  };

  const goToPreviousSignUpStep = () => {
    setSignUpError(null);
    setFieldErrors({});
    setStep2Errors({});
    setSignUpStep((previous) => Math.max(1, previous - 1));
  };

  const handleSignUpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSignUpError(null);
    setSignUpSuccess(null);

    const error = validateSignUpStep(4);
    if (error) {
      setSignUpError(error);
      return;
    }

    try {
      await registerWithEmail(signUpData.email, signUpData.password, {
        name: signUpData.name,
        role: signUpData.role || undefined,
        fieldA: resolveFieldA(signUpData),
        fieldB: resolveFieldB(signUpData),
        fieldC: signUpData.fieldC.trim()
      });
      const successMessage = t.accountCreatedSuccess;
      setRecentlyRegisteredEmail(signUpData.email);
      setSignUpSuccess(successMessage);
      setSignUpPopupMessage(successMessage);
      setMode("signin");
      setSignUpStep(1);
      setSignUpData(INITIAL_SIGNUP_DATA);
    } catch (error) {
      setSignUpError(getReadableSignUpError(error));
    }
  };

  const renderSignUpStep = () => {
    if (signUpStep === 1) {
      const roleOptions = (Object.keys(roleConfigs) as UserRole[]).map((role) => ({
        value: role,
        label: roleConfigs[role].label
      }));
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900" htmlFor="role">
            {t.selectRole}
          </label>
          <RolePicker
            id="role"
            options={roleOptions}
            value={signUpData.role}
            onChange={(v) => updateSignUpField("role", v)}
            placeholder={t.rolePlaceholder}
            aria-label={t.roleAria}
          />
          {selectedRoleConfig ? (
            <p className="text-xs text-slate-500">{selectedRoleConfig.helper}</p>
          ) : null}
        </div>
      );
    }

    if (signUpStep === 2) {
      return (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="signup-name">
              {t.fullName} <span className="text-red-500">*</span>
            </label>
            <Input
              id="signup-name"
              value={signUpData.name}
              onChange={(event) => {
                updateSignUpField("name", event.target.value);
                if (step2Errors.name) setStep2Errors((e) => ({ ...e, name: undefined }));
              }}
              placeholder={t.yourFullName}
              required
              className={step2Errors.name ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {step2Errors.name && <p className="text-xs text-red-500">{step2Errors.name}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="signup-email">
              {t.email} <span className="text-red-500">*</span>
            </label>
            <Input
              id="signup-email"
              type="email"
              value={signUpData.email}
              onChange={(event) => {
                updateSignUpField("email", event.target.value);
                if (step2Errors.email) setStep2Errors((e) => ({ ...e, email: undefined }));
              }}
              placeholder="name@domain.com"
              required
              className={step2Errors.email ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {step2Errors.email && <p className="text-xs text-red-500">{step2Errors.email}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="signup-password">
              {t.password} <span className="text-red-500">*</span>
            </label>
            <Input
              id="signup-password"
              type="password"
              value={signUpData.password}
              onChange={(event) => {
                updateSignUpField("password", event.target.value);
                if (step2Errors.password) setStep2Errors((e) => ({ ...e, password: undefined }));
              }}
              placeholder={t.min6Chars}
              required
              className={step2Errors.password ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {step2Errors.password && <p className="text-xs text-red-500">{step2Errors.password}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="signup-confirm-password">
              {t.confirmPassword} <span className="text-red-500">*</span>
            </label>
            <Input
              id="signup-confirm-password"
              type="password"
              value={signUpData.confirmPassword}
              onChange={(event) => {
                updateSignUpField("confirmPassword", event.target.value);
                if (step2Errors.confirmPassword) setStep2Errors((e) => ({ ...e, confirmPassword: undefined }));
              }}
              placeholder={t.reenterPassword}
              required
              className={step2Errors.confirmPassword ? "border-red-400 focus-visible:ring-red-400/30" : ""}
            />
            {step2Errors.confirmPassword && (
              <p className="text-xs text-red-500">{step2Errors.confirmPassword}</p>
            )}
          </div>
        </div>
      );
    }

    if (signUpStep === 3 && selectedRoleConfig) {
      const config = selectedRoleConfig;
      const f1 = config.fields[0];
      const f2 = config.fields[1];
      const f3 = config.fields[2];
      const showFieldAOther = isUniversityRole && signUpData.fieldA === OTHER_UNIVERSITY_VALUE;
      const isFieldBOther = isOtherSelection(signUpData.fieldB);
      const showFieldBOther =
        (isStudent && isFieldBOther) ||
        (!isStudent && config.field2Kind === "dropdown" && isOtherSelection(signUpData.fieldB));

      return (
        <div className="grid gap-4">
          {/* Field 1 - University dropdown or text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="fieldA">
              {f1.label}
              {!f1.optional && <span className="text-red-500"> *</span>}
            </label>
            {config.field1Kind === "university" ? (
              <>
                <UniversityPicker
                  id="fieldA"
                  value={signUpData.fieldA}
                  onChange={(v) => {
                    updateSignUpField("fieldA", v);
                    if (v !== OTHER_UNIVERSITY_VALUE) updateSignUpField("fieldB", "");
                  }}
                  placeholder={t.universityPlaceholder}
                  aria-label={t.universityAria}
                />
                {showFieldAOther && (
                  <Input
                    value={signUpData.fieldAOther}
                    onChange={(e) => updateSignUpField("fieldAOther", e.target.value)}
                    placeholder={t.enterUniversityName}
                    className="mt-2"
                  />
                )}
              </>
            ) : (
              <Input
                id="fieldA"
                value={signUpData.fieldA}
                onChange={(e) => updateSignUpField("fieldA", e.target.value)}
                placeholder={f1.placeholder}
              />
            )}
            {fieldErrors.fieldA && <p className="text-xs text-red-500">{fieldErrors.fieldA}</p>}
          </div>

          {/* Field 2 - Degree (dynamic), dropdown, or text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="fieldB">
              {f2.label}
              {!f2.optional && <span className="text-red-500"> *</span>}
            </label>
            {config.field2Kind === "degree" ? (
              <>
                <DegreePicker
                  id="fieldB"
                  options={degreePrograms}
                  value={signUpData.fieldB}
                  onChange={(v) => updateSignUpField("fieldB", v)}
                  placeholder={t.degreePlaceholder}
                  disabled={!resolveFieldA(signUpData)}
                  aria-label={t.degreeAria}
                />
                {showFieldBOther && (
                  <Input
                    value={signUpData.fieldBOther}
                    onChange={(e) => updateSignUpField("fieldBOther", e.target.value)}
                    placeholder={t.enterDegreeProgram}
                    className="mt-2"
                  />
                )}
              </>
            ) : config.field2Kind === "dropdown" && config.field2Options ? (
              <>
                <select
                  id="fieldB"
                  value={signUpData.fieldB}
                  onChange={(e) => updateSignUpField("fieldB", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="">{f2.placeholder}</option>
                  {config.field2Options.map((opt) => (
                    <option key={opt} value={opt}>
                      {localizeSignupOptionLabel(opt, language)}
                    </option>
                  ))}
                </select>
                {showFieldBOther && (
                  <Input
                    value={signUpData.fieldBOther}
                    onChange={(e) => updateSignUpField("fieldBOther", e.target.value)}
                    placeholder={t.pleaseSpecify}
                    className="mt-2"
                  />
                )}
              </>
            ) : (
              <Input
                id="fieldB"
                value={signUpData.fieldB}
                onChange={(e) => updateSignUpField("fieldB", e.target.value)}
                placeholder={f2.placeholder}
              />
            )}
            {fieldErrors.fieldB && <p className="text-xs text-red-500">{fieldErrors.fieldB}</p>}
          </div>

          {/* Field 3 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900" htmlFor="fieldC">
              {f3.label}
              {!f3.optional && <span className="text-red-500"> *</span>}
              {f3.optional && <span className="ml-1 text-slate-400">{t.optionalLabel}</span>}
            </label>
            {f3.type === "tel" ? (
              <Input
                id="fieldC"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={signUpData.fieldC}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                  updateSignUpField("fieldC", digits);
                }}
                placeholder={f3.placeholder}
                className={
                  fieldErrors.fieldC
                    ? "border-red-400 focus-visible:ring-red-400/30"
                    : f3.optional
                      ? "border-slate-200 bg-slate-50/50 dark:bg-slate-800/50"
                      : ""
                }
              />
            ) : (
              <Input
                id="fieldC"
                type={f3.type ?? "text"}
                value={signUpData.fieldC}
                onChange={(e) => updateSignUpField("fieldC", e.target.value)}
                placeholder={f3.placeholder}
                className={f3.optional ? "border-slate-200 bg-slate-50/50 dark:bg-slate-800/50" : ""}
              />
            )}
            {f3.helpText && <p className="text-xs text-slate-500">{f3.helpText}</p>}
            {fieldErrors.fieldC && <p className="text-xs text-red-500">{fieldErrors.fieldC}</p>}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:bg-slate-800/50 dark:border-slate-700">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{t.reviewDetails}</p>
          <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
            <li>{t.name}: {signUpData.name}</li>
            <li>{t.email}: {signUpData.email}</li>
            <li>{t.role}: {signUpData.role ? roleConfigs[signUpData.role].label : "-"}</li>
            <li>{selectedRoleConfig?.fields[0].label}: {resolveFieldA(signUpData) || "-"}</li>
            <li>{selectedRoleConfig?.fields[1].label}: {resolveFieldB(signUpData) || "-"}</li>
            <li>{selectedRoleConfig?.fields[2].label}: {signUpData.fieldC.trim() || "-"}</li>
          </ul>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={signUpData.acceptedTerms}
            onChange={(event) => {
              updateSignUpField("acceptedTerms", event.target.checked);
              if (signUpError === t.acceptTerms) setSignUpError(null);
            }}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          {t.termsStatement}
        </label>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_-45px_rgba(15,23,42,0.45)]">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                mode === "signin" ? "bg-primary text-white" : "text-slate-600"
              }`}
            >
              {t.signInTab}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                mode === "signup" ? "bg-primary text-white" : "text-slate-600"
              }`}
            >
              {t.signUpTab}
            </button>
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            {mode === "signin" ? t.welcomeBack : t.createUniCareAccount}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "signin"
              ? t.signInSubtitle
              : t.signUpSubtitle}
          </p>
        </div>

        <div className="p-5 sm:p-6">
          {mode === "signin" ? (
            <form className="space-y-4" onSubmit={handleSignInSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  {t.email}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  aria-required="true"
                  defaultValue={recentlyRegisteredEmail ?? ""}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  {t.password}
                </label>
                <Input id="password" name="password" type="password" required aria-required="true" />
              </div>
              {isVerifiedRedirect ? (
                <p className="text-sm text-green-600">
                  {t.emailVerifiedSuccess}
                </p>
              ) : null}
              {signUpSuccess ? <p className="text-sm text-green-600">{signUpSuccess}</p> : null}
              {signInError ? <p className="text-sm text-red-500">{signInError}</p> : null}
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="submit">{t.signInButton}</Button>
                <Button type="button" variant="secondary" onClick={handleGoogleSignIn}>
                  {t.signInWithGoogle}
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <Link href="/forgot-password">{t.forgotPassword}</Link>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setSignInError(null);
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  {t.createAccountLink}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleSignUpSubmit}>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="space-y-2">
                    <div
                      className={`h-1 rounded-full ${
                        signUpStep >= step ? "bg-primary" : "bg-slate-200"
                      }`}
                    />
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                      {t.step} {step}
                    </p>
                  </div>
                ))}
              </div>

              {renderSignUpStep()}
              {signUpError ? <p className="text-sm text-red-500">{signUpError}</p> : null}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goToPreviousSignUpStep}
                  disabled={signUpStep === 1}
                  className={signUpStep === 1 ? "cursor-not-allowed opacity-50" : ""}
                >
                  {t.back}
                </Button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-sm font-medium text-slate-500 hover:text-slate-700"
                  >
                    {t.alreadyHaveAccount}
                  </button>
                  {signUpStep < 4 ? (
                    <Button type="button" onClick={goToNextSignUpStep}>
                      {t.continue}
                    </Button>
                  ) : (
                    <Button type="submit">{t.createAccountButton}</Button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {signUpPopupMessage ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold text-slate-900">{t.accountCreatedTitle}</h2>
            <p className="mt-2 text-sm text-slate-600">{signUpPopupMessage}</p>
            <div className="mt-5 flex justify-end">
              <Button type="button" onClick={() => setSignUpPopupMessage(null)}>
                {t.ok}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}



