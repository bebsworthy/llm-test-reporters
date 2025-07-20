"""Mixed test results for unittest reporter validation."""

import unittest
import time
import os


class TestMixedResults(unittest.TestCase):
    """Tests with mixed pass/fail results."""
    
    def test_passing_assertion(self):
        """This test should pass."""
        self.assertTrue(True)
        self.assertEqual(1 + 1, 2)
        self.assertEqual("hello".upper(), "HELLO")
    
    def test_failing_equality(self):
        """This test should fail with assertion error."""
        result = 2 + 2
        self.assertEqual(result, 5)  # This will fail
    
    def test_passing_comparison(self):
        """This test should pass."""
        self.assertGreater(10, 5)
        self.assertLess(3, 7)
        self.assertGreaterEqual(5, 5)
    
    def test_failing_type_error(self):
        """This test should fail with type error."""
        # This will raise TypeError
        result = "string" + 5
        self.assertEqual(result, "string5")
    
    @unittest.skip("Feature not implemented yet")
    def test_skipped_feature(self):
        """This test should be skipped."""
        self.fail("This shouldn't run")
    
    def test_passing_string_operations(self):
        """This test should pass."""
        text = "Python Testing"
        self.assertTrue(text.startswith("Python"))
        self.assertTrue(text.endswith("Testing"))
        self.assertIn("Test", text)
    
    def test_failing_key_error(self):
        """This test should fail with key error."""
        data = {"name": "John", "age": 30}
        # This will raise KeyError
        value = data["city"]
        self.assertEqual(value, "New York")
    
    @unittest.expectedFailure
    def test_expected_failure(self):
        """This test is expected to fail."""
        self.assertEqual(1 / 0, float('inf'))
    
    def test_passing_list_operations(self):
        """This test should pass."""
        numbers = [1, 2, 3, 4, 5]
        self.assertEqual(sum(numbers), 15)
        self.assertEqual(max(numbers), 5)
        self.assertEqual(min(numbers), 1)


class TestAsyncBehavior(unittest.TestCase):
    """Test async-like behavior with timeouts."""
    
    def test_quick_operation(self):
        """Test that completes quickly."""
        time.sleep(0.01)
        self.assertTrue(True)
    
    def test_value_error(self):
        """Test that should fail with ValueError."""
        # This will raise ValueError
        number = int("not a number")
        self.assertEqual(number, 42)
    
    def test_assertion_with_message(self):
        """Test with custom assertion message."""
        expected = [1, 2, 3]
        actual = [1, 2, 4]
        self.assertEqual(actual, expected, 
                        "Lists should match but third element differs")


class TestSetUpTearDown(unittest.TestCase):
    """Test setUp and tearDown functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.test_data = {"initialized": True}
        self.temp_file = "test_temp.txt"
        with open(self.temp_file, "w") as f:
            f.write("test content")
    
    def test_setup_data_available(self):
        """Test that setUp data is available."""
        self.assertTrue(self.test_data["initialized"])
        self.assertTrue(os.path.exists(self.temp_file))
    
    def test_failing_file_content(self):
        """Test that fails on file content check."""
        with open(self.temp_file, "r") as f:
            content = f.read()
        self.assertEqual(content, "wrong content")  # This will fail
    
    def test_passing_file_exists(self):
        """Test that file exists."""
        self.assertTrue(os.path.exists(self.temp_file))
    
    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.temp_file):
            os.remove(self.temp_file)


class TestMultipleFailures(unittest.TestCase):
    """Test with multiple assertion types that fail."""
    
    def test_multiple_assertions_first_fails(self):
        """Multiple assertions where first fails."""
        value = 5
        self.assertGreater(value, 10)  # This fails
        self.assertLess(value, 3)       # This won't be reached
        self.assertEqual(value, 0)      # This won't be reached either
    
    def test_index_error(self):
        """Test that fails with IndexError."""
        items = [1, 2, 3]
        # This will raise IndexError
        item = items[10]
        self.assertEqual(item, 4)
    
    def test_attribute_error(self):
        """Test that fails with AttributeError."""
        data = {"key": "value"}
        # This will raise AttributeError
        result = data.non_existent_method()
        self.assertIsNotNone(result)
    
    @unittest.skipIf(True, "Always skip this test")
    def test_conditional_skip(self):
        """This test is conditionally skipped."""
        self.fail("This should never run")
    
    def test_passing_at_end(self):
        """This test passes to show mixed results."""
        self.assertEqual(10 * 10, 100)
        self.assertTrue(isinstance("string", str))


class TestCustomAssertions(unittest.TestCase):
    """Test custom assertion scenarios."""
    
    def test_list_comparison_fail(self):
        """Test list comparison that fails."""
        expected = [1, 2, 3, 4, 5]
        actual = [1, 2, 30, 40, 5]
        self.assertEqual(actual, expected)
    
    def test_dict_comparison_fail(self):
        """Test dictionary comparison that fails."""
        expected = {"name": "John", "age": 30, "city": "NYC"}
        actual = {"name": "John", "age": 25, "city": "LA"}
        self.assertEqual(actual, expected)
    
    def test_passing_custom_check(self):
        """Test with custom validation that passes."""
        def is_valid_email(email):
            return "@" in email and "." in email
        
        self.assertTrue(is_valid_email("test@example.com"))
        self.assertFalse(is_valid_email("invalid-email"))
    
    @unittest.expectedFailure
    def test_unexpected_success(self):
        """This test is expected to fail but will pass."""
        # This will actually pass, causing unexpected success
        self.assertEqual(2 + 2, 4)


if __name__ == '__main__':
    unittest.main()