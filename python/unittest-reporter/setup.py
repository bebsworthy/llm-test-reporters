"""Setup configuration for unittest LLM reporter."""

from setuptools import setup, find_packages
import os

# Read README for long description
readme_path = os.path.join(os.path.dirname(__file__), "README.md")
if os.path.exists(readme_path):
    with open(readme_path, "r", encoding="utf-8") as f:
        long_description = f.read()
else:
    long_description = "LLM-optimized test reporter for unittest"

setup(
    name="llm-unittest-reporter",
    version="0.1.0",
    description="LLM-optimized test reporter for unittest",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="LLM Test Reporters Team",
    url="https://github.com/yourusername/llm-test-reporters",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[],
    entry_points={
        "console_scripts": [
            "llm-unittest=llm_unittest_reporter.runner:main",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Software Development :: Testing",
    ],
    python_requires=">=3.7",
    keywords="unittest testing llm reporter",
)