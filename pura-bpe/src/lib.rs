//! Backpressure economics: EWMA smoothing, congestion pricing, Boltzmann
//! routing weights, quality scoring, and max-weight scheduling.
//!
//! All arithmetic uses fixed-point u64 with basis-point (BPS = 10_000) scaling,
//! matching the Solidity contracts. No floating point anywhere.
//!
//! `#![no_std]` by default. Enable the `std` feature for `std::error::Error` impls.

#![cfg_attr(not(feature = "std"), no_std)]

extern crate alloc;

pub mod ewma;
pub mod pricing;
pub mod quality;
pub mod routing;
pub mod scoring;
pub mod types;
